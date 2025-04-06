import { Result, ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserId } from '@/domain/models/user/user-id.vo';
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@/domain/repositories/user.repository.interface';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

// Input: Requires the user ID to delete
type DeleteUserInput = {
  userId: string;
};

// Output: Void on success
type DeleteUserOutput = void;

/**
 * @class DeleteUserUsecase
 * @description Usecase for deleting a user by their ID.
 */
@injectable()
export class DeleteUserUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface
  ) {}

  /**
   * Executes the user deletion process.
   * @param input - Object containing the userId to delete.
   * @returns A Result containing void on success or an AppError.
   */
  async execute(input: DeleteUserInput): Promise<Result<DeleteUserOutput, AppError>> {
    // 1. Validate Input ID (Create UserId VO)
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

    // 2. Repository Interaction (delete)
    // Assuming delete operation is idempotent (doesn't fail if user not found)
    const deleteResult = await this.userRepository.delete(userIdVo);

    // 3. Error Handling
    if (deleteResult.isErr()) {
      // TODO: Replace with injected logger
      console.error('Failed to delete user:', deleteResult.error);
      // Assuming the error from repository is already InfrastructureError
      return err(
        new AppError(ErrorCode.DatabaseError, 'Failed to delete user', {
          cause: deleteResult.error,
        })
      );
    }

    // If deletion was successful (or user didn't exist), return ok
    return ok(undefined);
  }
}
