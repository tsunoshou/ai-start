// External Libraries
import { Result, ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

// Domain Layer
import { UserDTO } from '@/application/dtos/user.dto';
import { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity';
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@/domain/repositories/user.repository.interface';
// Shared Layer
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { AppError } from '@/shared/errors/app.error';
import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';
import { hashPassword } from '@/shared/utils/security/password.utils';
import { Email } from '@/shared/value-objects/email.vo';
import { PasswordHash } from '@/shared/value-objects/password-hash.vo';

// Application Layer

// Infrastructure Layer

// TODO: Define Input Type (e.g., CreateUserInput DTO)
type CreateUserInput = {
  name: string;
  email: string;
  passwordPlainText: string; // Plain text password from input
};

// TODO: Define Output Type (e.g., UserDTO)
// Use UserDTO as the output type
type CreateUserOutput = UserDTO;

/**
 * @class CreateUserUsecase
 * @description Usecase for creating a new user.
 * Handles input validation, password hashing, entity creation, and persistence.
 */
@injectable()
export class CreateUserUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface,
    @inject(LoggerToken)
    private readonly logger: LoggerInterface
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
        this.logger.error(
          {
            message: 'Unexpected validation error format',
            operation: 'createUser',
            email: input.email,
          },
          errors
        );
        return err(
          new AppError(ErrorCode.InternalServerError, 'Unexpected validation error format')
        );
      }
    }
    const [nameVo, emailVo] = validationResult.value;

    // 2. Password Hashing
    const hashedPasswordResult = await hashPassword(input.passwordPlainText, this.logger);
    if (hashedPasswordResult.isErr()) {
      this.logger.error(
        {
          message: 'Password hashing failed',
          operation: 'createUser',
          email: input.email,
        },
        hashedPasswordResult.error
      );
      return err(
        // Use specific error code
        new AppError(ErrorCode.PasswordHashingFailed, 'Failed to process password', {
          cause: hashedPasswordResult.error,
        })
      );
    }
    const passwordHashVoResult = PasswordHash.create(hashedPasswordResult.value);
    if (passwordHashVoResult.isErr()) {
      this.logger.error(
        {
          message: 'Password hash VO creation failed',
          operation: 'createUser',
          email: input.email,
        },
        passwordHashVoResult.error
      );
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
      this.logger.error(
        {
          message: 'User domain creation failed',
          operation: 'createUser',
          email: emailVo.value,
        },
        userCreateResult.error
      );
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
      this.logger.error(
        {
          message: 'User save failed',
          operation: 'createUser',
          userId: userEntity.id.value,
          email: userEntity.email.value,
        },
        saveResult.error
      );
      return err(
        new AppError(ErrorCode.DatabaseError, 'Failed to save user data', {
          cause: saveResult.error,
        })
      );
    }

    // ユーザー作成成功をログに記録
    this.logger.info({
      message: 'User created successfully',
      operation: 'createUser',
      userId: userEntity.id.value,
      email: userEntity.email.value,
    });

    // 5. Output Mapping (to DTO if necessary)
    // Map the created User entity to UserDTO
    const output: CreateUserOutput = UserMapper.toDTO(userEntity);

    // 6. Error Handling & Wrapping (already handled in previous steps)

    return ok(output);
  }
}
