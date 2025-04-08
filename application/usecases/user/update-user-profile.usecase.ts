import { ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserDTO } from '@/application/dtos/user.dto';
import { UserId } from '@/domain/models/user/user-id.vo';
import { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity'; // Import User entity
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@/domain/repositories/user.repository.interface';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';
import { AppResult } from '@/shared/types/common.types'; // Import AppResult

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

    // 3. Validate Input Data (Optional name for now)
    let newNameVo = currentUser.name; // Default to current name
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
      newNameVo = nameResult.value;
    }

    // 4. Update User Entity (by reconstructing with new values)
    // Assuming entity is immutable, create a new instance with updated fields
    // User.reconstruct should ideally handle this or a dedicated update method
    const updatedUser = User.reconstruct({
      ...currentUser, // Spread existing properties
      name: newNameVo, // Override name if changed
      // id, email, passwordHash, createdAt remain the same
      // updatedAt will be handled by the repository save method
    });

    // 5. Save Updated User Entity
    const saveResult = await this.userRepository.save(updatedUser);
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

    // 6. Map to DTO
    const output = UserMapper.toDTO(updatedUser);

    return ok(output);
  }
}
