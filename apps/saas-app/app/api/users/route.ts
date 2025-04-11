import 'reflect-metadata'; // Required for tsyringe
import { NextRequest } from 'next/server';
import { z } from 'zod';

import container from '@/config/container.config'; // Import DI container
import { processApiRequest } from '@core/shared/utils/api.utils';
import { CreateUserUsecase } from '@core/user/application/usecases/create-user.usecase';
import { ListUsersUsecase } from '@core/user/application/usecases/list-users.usecase';

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
  email: z.string().email('Invalid email format').optional(),
});

// Zodのパース結果の型
// eslint-disable-next-line @typescript-eslint/naming-convention
type ListUsersQueryParams = z.infer<typeof listUsersQuerySchema>;

/**
 * GET /api/users
 * Retrieves a list of users. Supports optional limit, offset and email query parameters.
 */
export async function GET(request: NextRequest) {
  return processApiRequest(request, {
    querySchema: listUsersQuerySchema as z.ZodType<ListUsersQueryParams>,
    handler: async (queryParams: ListUsersQueryParams) => {
      const listUsersUsecase = container.resolve(ListUsersUsecase);
      const result = await listUsersUsecase.execute({
        limit: queryParams.limit,
        offset: queryParams.offset,
        email: queryParams.email,
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
