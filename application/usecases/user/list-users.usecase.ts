import { Result, ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserDTO } from '@/application/dtos/user.dto';
import {
  type UserRepositoryInterface,
  UserRepositoryToken,
} from '@/domain/repositories/user.repository.interface';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

// Input: Optional pagination/filtering parameters
type ListUsersInput = {
  limit?: number;
  offset?: number;
  // Add filter criteria later if needed (e.g., filterByName, filterByEmail)
};

// Output: An array of user DTOs
type ListUsersOutput = UserDTO[];

/**
 * @class ListUsersUsecase
 * @description Usecase for retrieving a list of users, potentially with pagination.
 */
@injectable()
export class ListUsersUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface
  ) {}

  /**
   * Executes the user listing process.
   * @param input - Optional parameters like limit and offset.
   * @returns A Result containing an array of UserDTOs or an AppError.
   */
  async execute(input: ListUsersInput = {}): Promise<Result<ListUsersOutput, AppError>> {
    // 1. Validate Input (e.g., limit/offset validity) - Optional for now
    // Consider adding validation for limit/offset (e.g., positive numbers)

    // 2. Repository Interaction (findAll or equivalent)
    const findAllResult = await this.userRepository.findAll({
      limit: input.limit,
      offset: input.offset,
    });

    if (findAllResult.isErr()) {
      // TODO: Replace with injected logger
      console.error('Failed to list users:', findAllResult.error);
      // Assuming the error from repository is already InfrastructureError
      return err(
        new AppError(ErrorCode.DatabaseError, 'Failed to retrieve user list', {
          cause: findAllResult.error,
        })
      );
    }

    const users = findAllResult.value;

    // 3. Map to DTOs
    const output: ListUsersOutput = UserMapper.toDTOs(users);

    return ok(output);
  }
}
