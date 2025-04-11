import 'reflect-metadata';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { container } from 'tsyringe';

// Import DB Config

// Import Interfaces & Tokens

// Import Implementations
import { ENV } from '@/config/environment';
import { ConsoleLogger } from '@core/shared/logger/console.logger';
import { LoggerInterface } from '@core/shared/logger/logger.interface';
import { LoggerToken } from '@core/shared/logger/logger.token';
import { CreateUserUsecase } from '@core/user/application/usecases/create-user.usecase';
import { DeleteUserUsecase } from '@core/user/application/usecases/delete-user.usecase';
import { GetUserByIdUsecase } from '@core/user/application/usecases/get-user-by-id.usecase';
import { ListUsersUsecase } from '@core/user/application/usecases/list-users.usecase';
import { UpdateUserProfileUsecase } from '@core/user/application/usecases/update-user-profile.usecase';
import {
  UserRepositoryInterface,
  UserRepositoryToken,
} from '@core/user/domain/repositories/user.repository.interface';
import { UserRepository } from '@core/user/infrastructure/repositories/user.repository';

// --- Dependency Registration ---

// Database Connection (Singleton)
const POOL = new Pool({ connectionString: ENV.DATABASE_URL });
const DB = drizzle(POOL);
container.register<typeof DB>('Database', { useValue: DB });

// Logger
container.register<LoggerInterface>(LoggerToken, {
  useClass: ConsoleLogger,
});

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
container.register<DeleteUserUsecase>(DeleteUserUsecase, {
  useClass: DeleteUserUsecase,
});

// --- Export Container ---
export default container;
