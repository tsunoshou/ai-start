import { ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserId } from '@core/user/domain/value-objects/user-id.vo';
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@core/user/domain/repositories/user.repository.interface';
import { AppError } from '@core/shared/errors/app.error';
import { ErrorCode } from '@core/shared/enums/error-code.enum';
import type { LoggerInterface } from '@core/shared/logger/logger.interface';
import { LoggerToken } from '@core/shared/logger/logger.token';
import { AppResult } from '@core/shared/types/common.types';

// Input: Requires the user ID to delete
// eslint-disable-next-line @typescript-eslint/naming-convention
type DeleteUserInput = {
  userId: string;
};

// Output: Void on success
// eslint-disable-next-line @typescript-eslint/naming-convention
type DeleteUserOutput = void;

/**
 * @class DeleteUserUsecase
 * @description Usecase for deleting a user by their ID.
 */
@injectable()
export class DeleteUserUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface,
    @inject(LoggerToken)
    private readonly logger: LoggerInterface
  ) {}

  /**
   * Executes the user deletion process.
   * @param input - Object containing the userId to delete.
   * @returns A Result containing void on success or an AppError.
   */
  async execute(input: DeleteUserInput): Promise<AppResult<DeleteUserOutput>> {
    this.logger.debug({
      message: 'ユーザー削除リクエスト開始',
      operation: 'deleteUser',
      entityType: 'User',
      entityId: input.userId,
    });

    // 1. Validate Input ID (Create UserId VO)
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isErr()) {
      this.logger.warn({
        message: '無効なユーザーID形式',
        operation: 'deleteUser',
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

    try {
      // 2. Repository Interaction (find)
      const findResult = await this.userRepository.findById(userIdVo);
      if (findResult.isErr()) {
        this.logger.error(
          {
            message: 'ユーザー存在確認中にエラーが発生しました',
            operation: 'deleteUser',
            entityType: 'User',
            entityId: input.userId,
          },
          findResult.error
        );

        // Wrap InfrastructureError in AppError
        return err(
          findResult.error instanceof AppError
            ? findResult.error
            : new AppError(ErrorCode.DatabaseError, 'Failed to check user existence', {
                cause: findResult.error,
              })
        );
      }

      // 3. Error Handling
      if (!findResult.value) {
        this.logger.info({
          message: '削除しようとしたユーザーが存在しません',
          operation: 'deleteUser',
          entityType: 'User',
          entityId: input.userId,
        });
        return ok(undefined); // 冪等性のため成功としてOK
      }

      // 4. Repository Interaction (delete)
      const deleteResult = await this.userRepository.delete(userIdVo);

      if (deleteResult.isErr()) {
        this.logger.error(
          {
            message: 'ユーザー削除中にエラーが発生しました',
            operation: 'deleteUser',
            entityType: 'User',
            entityId: input.userId,
          },
          deleteResult.error
        );

        // Wrap InfrastructureError in AppError
        return err(
          deleteResult.error instanceof AppError
            ? deleteResult.error
            : new AppError(ErrorCode.DatabaseError, 'Failed to delete user', {
                cause: deleteResult.error,
              })
        );
      }

      this.logger.info({
        message: 'ユーザーの削除に成功しました',
        operation: 'deleteUser',
        entityType: 'User',
        entityId: input.userId,
      });

      // If deletion was successful (or user didn't exist), return ok
      return ok(undefined);
    } catch (error) {
      this.logger.error(
        {
          message: 'ユーザー削除中に予期しないエラーが発生しました',
          operation: 'deleteUser',
          entityType: 'User',
          entityId: input.userId,
        },
        error
      );

      return err(
        new AppError(
          ErrorCode.InternalServerError,
          'An unexpected error occurred while deleting user',
          { cause: error instanceof Error ? error : undefined }
        )
      );
    }
  }
}
