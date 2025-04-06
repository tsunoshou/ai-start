import 'reflect-metadata';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { container } from 'tsyringe';

// Import DB Config

// Import Interfaces & Tokens

// Import Implementations
import { CreateUserUsecase } from '@/application/usecases/user/create-user.usecase';
import { GetUserByIdUsecase } from '@/application/usecases/user/get-user-by-id.usecase';
import { ListUsersUsecase } from '@/application/usecases/user/list-users.usecase';
import { UpdateUserProfileUsecase } from '@/application/usecases/user/update-user-profile.usecase';
import { ENV } from '@/config/environment';
import {
  UserRepositoryInterface,
  UserRepositoryToken,
} from '@/domain/repositories/user.repository.interface';
import { UserRepository } from '@/infrastructure/database/repositories/user.repository';

// --- Dependency Registration ---

// Database Connection (Singleton)
const POOL = new Pool({ connectionString: ENV.DATABASE_URL });
const DB = drizzle(POOL);
container.register<typeof DB>('Database', { useValue: DB });

// Repositories
container.register<UserRepositoryInterface>(UserRepositoryToken, {
  useClass: UserRepository,
});

// Usecases
container.register<CreateUserUsecase>(CreateUserUsecase, {
  useClass: CreateUserUsecase,
});
container.register<GetUserByIdUsecase>(GetUserByIdUsecase, {
  useClass: GetUserByIdUsecase,
});
container.register<UpdateUserProfileUsecase>(UpdateUserProfileUsecase, {
  useClass: UpdateUserProfileUsecase,
});
container.register<ListUsersUsecase>(ListUsersUsecase, {
  useClass: ListUsersUsecase,
});

// --- Export Container ---
export default container;
