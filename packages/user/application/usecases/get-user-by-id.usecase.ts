import { ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserDTO } from '@core/user/application/dtos/user.dto.ts';
import { UserId } from '@core/user/domain/value-objects/user-id.vo.ts';
// import { User } from '@/domain/models/user/user.entity'; // Removed unused import
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@core/user/domain/repositories/user.repository.interface.ts';
import { UserMapper } from '@core/user/infrastructure/mappers/user.mapper.ts';
import { AppError } from '@core/shared/errors/app.error.ts';
import { ErrorCode } from '@core/shared/enums/error-code.enum.ts';
import type { LoggerInterface } from '@core/shared/logger/logger.interface.ts';
import { LoggerToken } from '@core/shared/logger/logger.token.ts';
import { AppResult } from '@core/shared/types/common.types.ts';

// Application Layer

// Infrastructure Layer

// Input: Requires the user ID
// eslint-disable-next-line @typescript-eslint/naming-convention
type GetUserByIdInput = {
  userId: string;
};

// Output: The found User entity (or null), or a DTO later
// eslint-disable-next-line @typescript-eslint/naming-convention
type GetUserByIdOutput = UserDTO | null;

/**
 * @class GetUserByIdUsecase
 * @description Usecase for retrieving a user by their ID.
 */
@injectable()
export class GetUserByIdUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface,
    @inject(LoggerToken)
    private readonly logger: LoggerInterface
  ) {}

  /**
   * Executes the user retrieval process.
   * @param input - Object containing the userId.
   * @returns A Result containing the User entity or null if not found, or an AppError.
   */
  async execute(input: GetUserByIdInput): Promise<AppResult<GetUserByIdOutput>> {
    this.logger.debug({
      message: 'ユーザーID検索リクエスト開始',
      operation: 'getUserById',
      entityType: 'User',
      entityId: input.userId,
    });

    // 1. Input Validation (Create UserId VO)
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isErr()) {
      this.logger.warn({
        message: '無効なユーザーID形式',
        operation: 'getUserById',
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

    // 2. Repository Interaction (findById)
    const findResult = await this.userRepository.findById(userIdVo);

    if (findResult.isErr()) {
      // リポジトリのエラーをラップ
      this.logger.error(
        {
          message: 'ユーザー検索中にエラーが発生しました',
          operation: 'getUserById',
          entityType: 'User',
          entityId: userIdVo.value,
        },
        findResult.error
      );

      // Wrap InfrastructureError in AppError
      return err(
        findResult.error instanceof AppError
          ? findResult.error
          : new AppError(ErrorCode.DatabaseError, 'Failed to retrieve user data', {
              cause: findResult.error,
            })
      );
    }

    // 3. Output Mapping (to DTO if necessary)
    // findResult.value is User | null
    const userEntity = findResult.value;
    // Map to DTO if user exists, otherwise keep null
    const output: GetUserByIdOutput = userEntity ? UserMapper.toDTO(userEntity) : null;

    if (output) {
      this.logger.info({
        message: 'ユーザーの取得に成功しました',
        operation: 'getUserById',
        entityType: 'User',
        entityId: userIdVo.value,
      });
    } else {
      this.logger.info({
        message: 'ユーザーが見つかりませんでした',
        operation: 'getUserById',
        entityType: 'User',
        entityId: userIdVo.value,
      });
    }

    // 4. Error Handling (already handled)

    return ok(output);
  }
}
