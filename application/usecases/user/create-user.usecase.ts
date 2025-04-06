// External Libraries
import { Result, ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

// Domain Layer
import { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity';
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@/domain/repositories/user.repository.interface';
// Shared Layer
import { AppError } from '@/shared/errors/app.error';
import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { hashPassword } from '@/shared/utils/security/password.utils';
import { Email } from '@/shared/value-objects/email.vo';
import { PasswordHash } from '@/shared/value-objects/password-hash.vo';

// TODO: Define Input Type (e.g., CreateUserInput DTO)
type CreateUserInput = {
  name: string;
  email: string;
  passwordPlainText: string; // Plain text password from input
};

// TODO: Define Output Type (e.g., UserDTO)
// For now, let's assume it returns the created User entity for simplicity,
// but we should create a UserDTO later.
type CreateUserOutput = User;

/**
 * @class CreateUserUsecase
 * @description Usecase for creating a new user.
 * Handles input validation, password hashing, entity creation, and persistence.
 */
@injectable()
export class CreateUserUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface
  ) {}

  /**
   * Executes the user creation process.
   * @param input - The user data for creation (name, email, plain password).
   * @returns A Result containing the created User entity (or DTO later) or an AppError.
   */
  async execute(input: CreateUserInput): Promise<Result<CreateUserOutput, AppError>> {
    // 1. Input Validation & Value Object Creation
    const nameResult = UserName.create(input.name);
    const emailResult = Email.create(input.email);

    const validationResult = Result.combine([nameResult, emailResult]);
    if (validationResult.isErr()) {
      const errors = validationResult.error; // Type should be (BaseError | Error)[]
      if (Array.isArray(errors)) {
        const errorMessages = errors
          .map((e: BaseError | Error) => e.message) // Add type annotation for e
          .join(', ');
        return err(new AppError(ErrorCode.ValidationError, `Invalid input: ${errorMessages}`));
      } else {
        // Fallback for unexpected error format (should not happen with combine)
        console.error('Unexpected validation error format:', errors);
        return err(
          new AppError(ErrorCode.InternalServerError, 'Unexpected validation error format')
        );
      }
    }
    const [nameVo, emailVo] = validationResult.value;

    // 2. Password Hashing
    const hashedPasswordResult = await hashPassword(input.passwordPlainText);
    if (hashedPasswordResult.isErr()) {
      // TODO: Replace with injected logger
      console.error('Password hashing failed:', hashedPasswordResult.error);
      return err(
        // Use specific error code
        new AppError(ErrorCode.PasswordHashingFailed, 'Failed to process password', {
          cause: hashedPasswordResult.error,
        })
      );
    }
    const passwordHashVoResult = PasswordHash.create(hashedPasswordResult.value);
    if (passwordHashVoResult.isErr()) {
      // TODO: Replace with injected logger
      console.error('Password hash VO creation failed:', passwordHashVoResult.error);
      return err(
        // This might still be an internal server error if hash generation is broken
        new AppError(ErrorCode.InternalServerError, 'Invalid password hash format generated', {
          cause: passwordHashVoResult.error,
        })
      );
    }
    const passwordHashVo = passwordHashVoResult.value;

    // 3. Domain Entity Creation (User.create) - Assuming User.create returns Result
    const userCreateResult = User.create({
      name: nameVo,
      email: emailVo,
      passwordHash: passwordHashVo,
    });

    if (userCreateResult.isErr()) {
      // Use specific error code
      // TODO: Replace with injected logger
      console.error('User domain creation failed:', userCreateResult.error);
      return err(
        new AppError(
          ErrorCode.DomainRuleViolation,
          'Failed to create user due to domain rule violation',
          { cause: userCreateResult.error }
        )
      );
    }
    const userEntity = userCreateResult.value;

    // 4. Repository Interaction (save)
    const saveResult = await this.userRepository.save(userEntity);
    if (saveResult.isErr()) {
      // TODO: Replace with injected logger
      console.error('User save failed:', saveResult.error);
      return err(
        new AppError(ErrorCode.DatabaseError, 'Failed to save user data', {
          cause: saveResult.error,
        })
      );
    }

    // 5. Output Mapping (to DTO if necessary)
    const output: CreateUserOutput = userEntity;

    // 6. Error Handling & Wrapping (already handled in previous steps)

    return ok(output);
  }
}
