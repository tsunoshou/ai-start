import { ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserDTO } from '@core/user/application/dtos/user.dto.ts';
import { UserId } from '@core/user/domain/value-objects/user-id.vo.ts';
import { UserName } from '@core/user/domain/value-objects/user-name.vo.ts';
import { User } from '@core/user/domain/entities/user.entity.ts'; // Import User entity
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@core/user/domain/repositories/user.repository.interface.ts';
import { UserMapper } from '@core/user/infrastructure/mappers/user.mapper.ts';
import { AppError } from '@core/shared/errors/app.error.ts';
import { ErrorCode } from '@core/shared/enums/error-code.enum.ts';
import type { LoggerInterface } from '@core/shared/logger/logger.interface.ts';
import { LoggerToken } from '@core/shared/logger/logger.token.ts';
import { AppResult } from '@core/shared/types/common.types.ts'; // Import AppResult

// Input: Requires the user ID and the fields to update (optional name for now)
// eslint-disable-next-line @typescript-eslint/naming-convention
type UpdateUserProfileInput = {
  userId: string;
  name?: string; // Optional: only update if provided
  // Add other updatable fields like email later if needed
};

// Output: The updated user DTO
// eslint-disable-next-line @typescript-eslint/naming-convention
type UpdateUserProfileOutput = UserDTO;

/**
 * @class UpdateUserProfileUsecase
 * @description Usecase for updating a user's profile information (e.g., name).
 */
@injectable()
export class UpdateUserProfileUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface,
    @inject(LoggerToken)
    private readonly logger: LoggerInterface
  ) {}

  /**
   * Executes the user profile update process.
   * @param input - Object containing the userId and fields to update.
   * @returns A Result containing the updated UserDTO or an AppError.
   */
  async execute(input: UpdateUserProfileInput): Promise<AppResult<UpdateUserProfileOutput>> {
    // Use AppResult
    this.logger.debug({
      message: 'ユーザープロフィール更新リクエスト開始',
      operation: 'updateUserProfile',
      entityType: 'User',
      entityId: input.userId,
    });

    // 1. Validate Input ID (Create UserId VO)
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isErr()) {
      this.logger.warn({
        message: '無効なユーザーID形式',
        operation: 'updateUserProfile',
        entityType: 'User',
        entityId: input.userId,
        errorDetail: userIdResult.error.message,
      });

      return err(
        new AppError(
          ErrorCode.ValidationError,
          `Invalid user ID format: ${userIdResult.error.message}`,
          { cause: userIdResult.error }
        )
      );
    }
    const userIdVo = userIdResult.value;

    // 2. Fetch Existing User
    const findResult = await this.userRepository.findById(userIdVo);
    if (findResult.isErr()) {
      // Infrastructure error during find
      this.logger.error(
        {
          message: 'ユーザー検索中にエラーが発生しました',
          operation: 'updateUserProfile',
          entityType: 'User',
          entityId: input.userId,
        },
        findResult.error
      );

      // Wrap InfrastructureError in AppError
      return err(
        findResult.error instanceof AppError
          ? findResult.error
          : new AppError(ErrorCode.DatabaseError, 'Failed to retrieve user', {
              cause: findResult.error,
            })
      );
    }
    const currentUser = findResult.value;
    if (!currentUser) {
      this.logger.info({
        message: '更新対象のユーザーが見つかりませんでした',
        operation: 'updateUserProfile',
        entityType: 'User',
        entityId: input.userId,
      });

      return err(new AppError(ErrorCode.NotFound, 'User not found'));
    }

    let userToUpdate: User = currentUser; // Start with the current user

    // Update Name if provided
    if (input.name !== undefined) {
      const nameResult = UserName.create(input.name);
      if (nameResult.isErr()) {
        this.logger.warn({
          message: '無効なユーザー名形式',
          operation: 'updateUserProfile',
          entityType: 'User',
          entityId: input.userId,
          name: input.name,
          errorDetail: nameResult.error.message,
        });

        return err(
          new AppError(
            ErrorCode.ValidationError,
            `Invalid user name format: ${nameResult.error.message}`,
            { cause: nameResult.error }
          )
        );
      }
      // ★ Call entity's changeName method
      const nameChangeResult = userToUpdate.changeName(nameResult.value);
      if (nameChangeResult.isErr()) {
        // Handle potential errors from changeName
        const baseError = nameChangeResult.error; // BaseError を取得
        this.logger.error(
          {
            message: 'changeName メソッドでエラーが発生しました',
            operation: 'updateUserProfile',
            entityType: 'User',
            entityId: input.userId,
          },
          baseError
        );
        // ★ BaseError を AppError でラップする
        return err(
          new AppError(
            ErrorCode.InternalServerError, // または適切なErrorCode
            `Error changing user name: ${baseError.message}`,
            { cause: baseError }
          )
        );
      }
      userToUpdate = nameChangeResult.value; // ★ Update userToUpdate with the new instance
    }

    // // ★ Add logic for other updatable fields similarly (Example for Email)
    // if (input.email !== undefined) {
    //   const emailResult = Email.create(input.email);
    //   if (emailResult.isErr()) {
    //     // ... validation error handling ...
    //     return err(/* ... */);
    //   }
    //   const emailChangeResult = userToUpdate.changeEmail(emailResult.value);
    //   if (emailChangeResult.isErr()) {
    //      // ... error handling ...
    //     return err(emailChangeResult.error);
    //   }
    //   userToUpdate = emailChangeResult.value;
    // }

    // 4. Save Updated User Entity (only if changes were made)
    // Check object identity: if userToUpdate is different from currentUser, a new instance was created.
    if (userToUpdate !== currentUser) {
      const saveResult = await this.userRepository.save(userToUpdate); // ★ Pass the potentially new instance
      if (saveResult.isErr()) {
        this.logger.error(
          {
            message: 'ユーザー保存中にエラーが発生しました',
            operation: 'updateUserProfile',
            entityType: 'User',
            entityId: input.userId,
          },
          saveResult.error
        );
        // Wrap InfrastructureError/AppError in AppError
        return err(
          saveResult.error instanceof AppError
            ? saveResult.error
            : new AppError(ErrorCode.DatabaseError, 'Failed to save updated user', {
                cause: saveResult.error,
              })
        );
      }
      this.logger.info({
        message: 'ユーザープロフィールの更新に成功しました',
        operation: 'updateUserProfile',
        entityType: 'User',
        entityId: input.userId,
      });
    } else {
      // No changes detected
      this.logger.info({
        message: 'ユーザープロフィールに変更はありませんでした',
        operation: 'updateUserProfile',
        entityType: 'User',
        entityId: input.userId,
      });
    }

    // 5. Map the final state of userToUpdate to DTO
    const output = UserMapper.toDTO(userToUpdate);

    return ok(output);
  }
}
