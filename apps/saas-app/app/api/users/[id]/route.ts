import 'reflect-metadata';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import container from '@/config/container.config';
import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { AppError } from '@core/shared/errors/app.error';
import { apiError, apiSuccess, handleApiError } from '@core/shared/utils/api.utils';
import { DeleteUserUsecase } from '@core/user/application/usecases/delete-user.usecase';
import { GetUserByIdUsecase } from '@core/user/application/usecases/get-user-by-id.usecase';
import { UpdateUserProfileUsecase } from '@core/user/application/usecases/update-user-profile.usecase';

// Zod schema for PATCH request body validation (only allow known fields to be updated)
const updateUserProfileSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .max(50, 'Name must be 50 characters or less')
      .optional(),
    // Add other updatable fields here (e.g., email) as needed, marked optional
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Request body must contain at least one field to update.', // Ensure body is not empty
  });

// Common handler to get and validate userId from params
function getUserIdFromParams(params: { id?: string }): string {
  if (!params.id || typeof params.id !== 'string') {
    // This should ideally not happen if routing is correct, but defensively handle
    throw new AppError(ErrorCode.ValidationError, 'User ID parameter is missing or invalid.');
  }
  // Optionally add UUID validation here if needed, though the usecase handles format
  return params.id;
}

/**
 * GET /api/users/{id}
 * Retrieves a specific user by ID.
 */
export async function GET(
  request: NextRequest, // request is unused but required by Next.js convention
  { params }: { params: { id?: string } }
) {
  try {
    // 1. Get and Validate User ID from URL
    const userId = getUserIdFromParams(params);

    // 2. Resolve Usecase
    const getUserByIdUsecase = container.resolve(GetUserByIdUsecase);

    // 3. Execute Usecase
    const result = await getUserByIdUsecase.execute({ userId });

    // 4. Handle Result
    if (result.isOk()) {
      const userDto = result.value;
      if (userDto) {
        return apiSuccess(200, userDto); // 200 OK with user DTO
      } else {
        // User not found by the usecase (valid ID format, but no matching user)
        return apiError(404, ErrorCode.NotFound, `User with ID ${userId} not found.`);
      }
    } else {
      // Usecase failed (e.g., invalid ID format, database error)
      throw result.error;
    }
  } catch (error: unknown) {
    // 5. Handle Errors globally
    return handleApiError(error);
  }
}

/**
 * PATCH /api/users/{id}
 * Updates a specific user's profile.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id?: string } }) {
  try {
    // 1. Get and Validate User ID from URL
    const userId = getUserIdFromParams(params);

    // 2. Resolve Usecase
    const updateUserProfileUsecase = container.resolve(UpdateUserProfileUsecase);

    // 3. Parse and Validate Request Body
    const body = await request.json();
    const validationResult = updateUserProfileSchema.safeParse(body);

    if (!validationResult.success) {
      throw validationResult.error; // Let handleApiError manage ZodError
    }
    const updateData = validationResult.data;

    // 4. Execute Usecase
    const result = await updateUserProfileUsecase.execute({
      userId,
      ...updateData, // Spread validated fields (e.g., name)
    });

    // 5. Handle Result
    if (result.isOk()) {
      return apiSuccess(200, result.value); // 200 OK with updated user DTO
    } else {
      // Usecase failed (e.g., validation, not found, db error)
      throw result.error;
    }
  } catch (error: unknown) {
    // 6. Handle Errors globally
    return handleApiError(error);
  }
}

/**
 * DELETE /api/users/{id}
 * Deletes a specific user by ID.
 */
export async function DELETE(
  request: NextRequest, // request is unused but required by Next.js convention
  { params }: { params: { id?: string } }
) {
  try {
    // 1. Get and Validate User ID from URL
    const userId = getUserIdFromParams(params);

    // 2. Resolve Usecase
    const deleteUserUsecase = container.resolve(DeleteUserUsecase);

    // 3. Execute Usecase
    const result = await deleteUserUsecase.execute({ userId });

    // 4. Handle Result
    if (result.isOk()) {
      // Return 204 No Content for successful deletion
      return new Response(null, { status: 204 });
    } else {
      // Usecase failed (e.g., invalid ID format, database error)
      throw result.error;
    }
  } catch (error: unknown) {
    // 5. Handle Errors globally
    return handleApiError(error);
  }
}
