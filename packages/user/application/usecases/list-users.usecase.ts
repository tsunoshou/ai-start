import { ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserDTO } from '@core/user/application/dtos/user.dto.ts';
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
import { Email } from '@core/shared/value-objects/email.vo.ts';

// Input: Optional pagination/filtering parameters
/**
 * Input for the ListUsersUsecase.
 * @property {number} [limit] - Maximum number of users to return.
 * @property {number} [offset] - Number of users to skip.
 * @property {string} [email] - Filter users by email address.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
type ListUsersInput = {
  limit?: number;
  offset?: number;
  email?: string;
};

// Output: An array of user DTOs
// eslint-disable-next-line @typescript-eslint/naming-convention
type ListUsersOutput = UserDTO[];

/**
 * @class ListUsersUsecase
 * @description Usecase for retrieving a list of users, potentially with pagination and email filtering.
 */
@injectable()
export class ListUsersUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface,
    @inject(LoggerToken)
    private readonly logger: LoggerInterface
  ) {}

  /**
   * Executes the user listing process.
   * If email is provided, filters by email.
   * Otherwise, retrieves a paginated list.
   *
   * @param {ListUsersInput} [input={}] - Optional parameters like limit, offset, and email.
   * @returns {Promise<AppResult<ListUsersOutput>>} A Result containing an array of UserDTOs or an AppError.
   */
  async execute(input: ListUsersInput = {}): Promise<AppResult<ListUsersOutput>> {
    this.logger.debug({
      message: 'ユーザー一覧取得/検索リクエスト開始',
      operation: 'listUsers',
      entityType: 'User',
      inputParams: input,
    });

    try {
      // 1. Emailフィルタリングの処理
      if (input.email) {
        const emailResult = Email.create(input.email);
        if (emailResult.isErr()) {
          this.logger.warn({
            message: '無効なEmail形式によるフィルタリング試行',
            operation: 'listUsers',
            email: input.email,
            errorDetail: emailResult.error.message,
          });
          // Email形式が無効な場合はAppErrorを返す
          return err(
            new AppError(
              ErrorCode.ValidationError,
              `Invalid email format for filtering: ${emailResult.error.message}`,
              { cause: emailResult.error }
            )
          );
        }
        const emailVo = emailResult.value;

        this.logger.debug({
          message: 'Emailによるユーザー検索実行',
          operation: 'listUsers',
          email: emailVo.value,
        });

        // Emailでユーザーを検索
        const findByEmailResult = await this.userRepository.findByEmail(emailVo);
        if (findByEmailResult.isErr()) {
          this.logger.error(
            {
              message: 'Emailによるユーザー検索中にエラーが発生しました',
              operation: 'listUsers',
              email: emailVo.value,
            },
            findByEmailResult.error
          );
          // リポジトリエラーをラップして返す
          return err(
            findByEmailResult.error instanceof AppError
              ? findByEmailResult.error
              : new AppError(ErrorCode.DatabaseError, 'Failed to search user by email', {
                  cause: findByEmailResult.error,
                })
          );
        }

        const user = findByEmailResult.value;
        const output: ListUsersOutput = user ? [UserMapper.toDTO(user)] : [];

        this.logger.info({
          message: user
            ? 'Emailによるユーザー検索に成功しました'
            : 'Emailによるユーザー検索結果、該当なし',
          operation: 'listUsers',
          email: emailVo.value,
          count: output.length,
        });

        return ok(output);
      }

      // 2. Emailフィルタリングがない場合: ページネーションで全件取得
      // Validate Input (limit/offset validity) - Optional for now
      // Consider adding validation for limit/offset (e.g., positive numbers)
      this.logger.debug({
        message: 'ページネーションによるユーザー一覧取得実行',
        operation: 'listUsers',
        limit: input.limit,
        offset: input.offset,
      });

      const findAllResult = await this.userRepository.findAll({
        limit: input.limit,
        offset: input.offset,
      });

      if (findAllResult.isErr()) {
        this.logger.error(
          {
            message: 'ユーザー一覧取得中にエラーが発生しました',
            operation: 'listUsers',
            entityType: 'User',
          },
          findAllResult.error
        );

        // Wrap InfrastructureError in AppError
        return err(
          findAllResult.error instanceof AppError
            ? findAllResult.error
            : new AppError(ErrorCode.DatabaseError, 'Failed to retrieve user list', {
                cause: findAllResult.error,
              })
        );
      }

      const users = findAllResult.value;

      // 3. Map to DTOs
      const output: ListUsersOutput = UserMapper.toDTOs(users);

      this.logger.info({
        message: 'ユーザー一覧の取得に成功しました',
        operation: 'listUsers',
        entityType: 'User',
        count: users.length,
      });

      return ok(output);
    } catch (error) {
      this.logger.error(
        {
          message: 'ユーザー一覧取得/検索中に予期しないエラーが発生しました',
          operation: 'listUsers',
          entityType: 'User',
          inputParams: input,
        },
        error
      );

      return err(
        new AppError(
          ErrorCode.InternalServerError,
          'An unexpected error occurred while retrieving user list/searching by email',
          { cause: error instanceof Error ? error : undefined }
        )
      );
    }
  }
}
