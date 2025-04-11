// External Libraries
import { Result, ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

// Domain Layer
import { UserDTO } from '@core/user/application/dtos/user.dto';
import { UserName } from '@core/user/domain/value-objects/user-name.vo';
import { User } from '@core/user/domain/entities/user.entity';
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@core/user/domain/repositories/user.repository.interface';
// Shared Layer
import { UserMapper } from '@core/user/infrastructure/mappers/user.mapper';
import { AppError } from '@core/shared/errors/app.error';
import { BaseError } from '@core/shared/errors/base.error';
import { ErrorCode } from '@core/shared/enums/error-code.enum';
import type { LoggerInterface } from '@core/shared/logger/logger.interface';
import { LoggerToken } from '@core/shared/logger/logger.token';
import { AppResult } from '@core/shared/types/common.types';
import { hashPassword } from '@core/shared/utils/security/password.utils';
import { Email } from '@core/shared/value-objects/email.vo';
import { PasswordHash } from '@core/shared/value-objects/password-hash.vo';

// Application Layer

// Infrastructure Layer

// TODO: Define Input Type (e.g., CreateUserInput DTO)
// eslint-disable-next-line @typescript-eslint/naming-convention
type CreateUserInput = {
  name: string;
  email: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  passwordPlainText: string; // Plain text password from input
};

// TODO: Define Output Type (e.g., UserDTO)
// Use UserDTO as the output type
// eslint-disable-next-line @typescript-eslint/naming-convention
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
  async execute(input: CreateUserInput): Promise<AppResult<CreateUserOutput>> {
    // 1. Input Validation & Value Object Creation
    const nameResult = UserName.create(input.name);
    const emailResult = Email.create(input.email);

    // Use Result.combine directly as AppResult is for the final return type
    const validationResult = Result.combine([nameResult, emailResult]);
    if (validationResult.isErr()) {
      const errors = validationResult.error; // Type should be (BaseError | Error)[]
      if (Array.isArray(errors)) {
        const errorMessages = errors
          .map((e: BaseError | Error) => e.message) // Add type annotation for e
          .join(', ');
        // Return err wrapped in AppError
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
        // Return err wrapped in AppError
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
      // Return err wrapped in AppError
      return err(
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
      // Return err wrapped in AppError
      return err(
        new AppError(ErrorCode.InternalServerError, 'Invalid password hash format generated', {
          cause: passwordHashVoResult.error,
        })
      );
    }
    const passwordHashVo = passwordHashVoResult.value;

    // 3. Domain Entity Creation (User.create) - Assuming User.create returns Result
    // User.create might return BaseError, handle it appropriately
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
      // Wrap BaseError from domain in AppError
      const appErrorCode =
        userCreateResult.error.code === ErrorCode.InvalidIdentifierFormat
          ? ErrorCode.InternalServerError // Or a more specific code if needed
          : ErrorCode.DomainRuleViolation;
      return err(
        new AppError(appErrorCode, 'Failed to create user due to domain rule violation', {
          cause: userCreateResult.error,
        })
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
        saveResult.error // Already AppError or InfrastructureError
      );
      // Wrap the repository error (which could be AppError or InfrastructureError) in an AppError
      return err(
        saveResult.error instanceof AppError
          ? saveResult.error
          : new AppError(ErrorCode.DatabaseError, 'Failed to save user data', {
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
