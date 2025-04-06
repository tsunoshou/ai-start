import { Result, ok, err } from 'neverthrow';
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

// Input: Requires the user ID and the fields to update (optional name for now)
type UpdateUserProfileInput = {
  userId: string;
  name?: string; // Optional: only update if provided
  // Add other updatable fields like email later if needed
};

// Output: The updated user DTO
type UpdateUserProfileOutput = UserDTO;

/**
 * @class UpdateUserProfileUsecase
 * @description Usecase for updating a user's profile information (e.g., name).
 */
@injectable()
export class UpdateUserProfileUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface
  ) {}

  /**
   * Executes the user profile update process.
   * @param input - Object containing the userId and fields to update.
   * @returns A Result containing the updated UserDTO or an AppError.
   */
  async execute(input: UpdateUserProfileInput): Promise<Result<UpdateUserProfileOutput, AppError>> {
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

    // 2. Fetch Existing User
    const findResult = await this.userRepository.findById(userIdVo);
    if (findResult.isErr()) {
      // Infrastructure error during find
      // TODO: Replace with injected logger
      console.error('Failed to fetch user for update:', findResult.error);
      return err(
        new AppError(ErrorCode.DatabaseError, 'Failed to retrieve user data for update', {
          cause: findResult.error,
        })
      );
    }
    const currentUser = findResult.value;
    if (!currentUser) {
      return err(new AppError(ErrorCode.NotFound, `User with ID ${input.userId} not found.`));
    }

    // 3. Validate Input Data (Optional name for now)
    let newNameVo = currentUser.name; // Default to current name
    if (input.name !== undefined) {
      const nameResult = UserName.create(input.name);
      if (nameResult.isErr()) {
        return err(
          new AppError(
            ErrorCode.ValidationError,
            `Invalid name format: ${nameResult.error.message}`
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
      // TODO: Replace with injected logger
      console.error('Failed to save updated user:', saveResult.error);
      return err(
        new AppError(ErrorCode.DatabaseError, 'Failed to save updated user profile', {
          cause: saveResult.error,
        })
      );
    }

    // 6. Map to DTO
    const output = UserMapper.toDTO(updatedUser);

    return ok(output);
  }
}
