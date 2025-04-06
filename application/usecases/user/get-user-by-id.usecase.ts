import { Result, ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserDTO } from '@/application/dtos/user.dto';
import { UserId } from '@/domain/models/user/user-id.vo';
// import { User } from '@/domain/models/user/user.entity'; // Removed unused import
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@/domain/repositories/user.repository.interface';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

// Application Layer

// Infrastructure Layer

// Input: Requires the user ID
type GetUserByIdInput = {
  userId: string;
};

// Output: The found User entity (or null), or a DTO later
type GetUserByIdOutput = UserDTO | null;

/**
 * @class GetUserByIdUsecase
 * @description Usecase for retrieving a user by their ID.
 */
@injectable()
export class GetUserByIdUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface
  ) {}

  /**
   * Executes the user retrieval process.
   * @param input - Object containing the userId.
   * @returns A Result containing the User entity or null if not found, or an AppError.
   */
  async execute(input: GetUserByIdInput): Promise<Result<GetUserByIdOutput, AppError>> {
    // 1. Input Validation (Create UserId VO)
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isErr()) {
      return err(
        new AppError(
          ErrorCode.ValidationError,
          `Invalid user ID format: ${userIdResult.error.message}`
        )
      );
    }
    const userIdVo = userIdResult.value;

    // 2. Repository Interaction (findById)
    const findResult = await this.userRepository.findById(userIdVo);

    if (findResult.isErr()) {
      // リポジトリのエラーをラップ
      // TODO: Replace with injected logger
      console.error('Failed to find user by ID:', findResult.error);
      return err(
        new AppError(ErrorCode.DatabaseError, 'Failed to retrieve user data', {
          cause: findResult.error,
        })
      );
    }

    // 3. Output Mapping (to DTO if necessary)
    // findResult.value is User | null
    const userEntity = findResult.value;
    // Map to DTO if user exists, otherwise keep null
    const output: GetUserByIdOutput = userEntity ? UserMapper.toDTO(userEntity) : null;

    // 4. Error Handling (already handled)

    return ok(output);
  }
}
