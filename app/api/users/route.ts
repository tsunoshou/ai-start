import 'reflect-metadata'; // Required for tsyringe
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { CreateUserUsecase } from '@/application/usecases/user/create-user.usecase';
import { ListUsersUsecase } from '@/application/usecases/user/list-users.usecase';
import container from '@/config/container.config'; // Import DI container
import { processApiRequest } from '@/shared/utils/api.utils';

// Zod schema for POST request body validation
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  email: z.string().email('Invalid email format'),
  passwordPlainText: z.string().min(8, 'Password must be at least 8 characters long'),
  // Add more password complexity rules if needed
});

// ListUsersInput型に合わせたスキーマ定義
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

// Zodのパース結果の型
type QueryParams = z.infer<typeof listUsersQuerySchema>;

/**
 * GET /api/users
 * Retrieves a list of users. Supports optional limit and offset query parameters.
 */
export async function GET(request: NextRequest) {
  return processApiRequest(request, {
    querySchema: listUsersQuerySchema as z.ZodType<QueryParams>,
    handler: async (queryParams: QueryParams) => {
      const listUsersUsecase = container.resolve(ListUsersUsecase);
      const result = await listUsersUsecase.execute({
        limit: queryParams.limit,
        offset: queryParams.offset,
      });

      if (result.isErr()) {
        throw result.error;
      }

      return result.value;
    },
  });
}

/**
 * POST /api/users
 * Creates a new user.
 */
export async function POST(request: NextRequest) {
  return processApiRequest(request, {
    bodySchema: createUserSchema,
    successStatus: 201,
    handler: async (createUserDto) => {
      const createUserUsecase = container.resolve(CreateUserUsecase);
      const result = await createUserUsecase.execute(createUserDto);

      if (result.isErr()) {
        throw result.error;
      }

      return result.value;
    },
  });
}
