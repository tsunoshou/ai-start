import 'reflect-metadata'; // Required for tsyringe
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { CreateUserUsecase } from '@/application/usecases/user/create-user.usecase';
import { ListUsersUsecase } from '@/application/usecases/user/list-users.usecase';
import container from '@/config/container.config'; // Import DI container
import { apiSuccess, handleApiError } from '@/shared/utils/api.utils';

// Zod schema for POST request body validation
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  email: z.string().email('Invalid email format'),
  passwordPlainText: z.string().min(8, 'Password must be at least 8 characters long'),
  // Add more password complexity rules if needed
});

// Zod schema for GET request query parameters validation (optional)
const listUsersQuerySchema = z.object({
  limit: z.preprocess(
    (val) => (val ? parseInt(String(val), 10) : undefined),
    z.number().int().positive().optional()
  ),
  offset: z.preprocess(
    (val) => (val ? parseInt(String(val), 10) : undefined),
    z.number().int().nonnegative().optional()
  ),
});

/**
 * GET /api/users
 * Retrieves a list of users. Supports optional limit and offset query parameters.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Resolve Usecase from DI container
    const listUsersUsecase = container.resolve(ListUsersUsecase);

    // 2. Validate Query Parameters (Optional)
    const { searchParams } = request.nextUrl;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = listUsersQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      // Use ZodError instance for specific handling
      throw validationResult.error;
    }
    const { limit, offset } = validationResult.data;

    // 3. Execute Usecase
    const result = await listUsersUsecase.execute({ limit, offset });

    // 4. Handle Result
    if (result.isOk()) {
      return apiSuccess(200, result.value); // 200 OK with user list
    } else {
      // Should not happen if usecase only fails on DB error, but handle defensively
      throw result.error; // Let handleApiError manage AppError
    }
  } catch (error: unknown) {
    // 5. Handle Errors globally
    return handleApiError(error);
  }
}

/**
 * POST /api/users
 * Creates a new user.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Resolve Usecase from DI container
    const createUserUsecase = container.resolve(CreateUserUsecase);

    // 2. Parse and Validate Request Body
    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      // Use ZodError instance for specific handling
      throw validationResult.error;
    }
    const createUserDto = validationResult.data;

    // 3. Execute Usecase
    const result = await createUserUsecase.execute(createUserDto);

    // 4. Handle Result
    if (result.isOk()) {
      return apiSuccess(201, result.value); // 201 Created with new user DTO
    } else {
      // Usecase returns AppError on failure
      throw result.error; // Let handleApiError manage AppError
    }
  } catch (error: unknown) {
    // 5. Handle Errors globally
    return handleApiError(error);
  }
}
