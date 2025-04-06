import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe'; // Lifecycle をインポート

// Domain Layer Imports
import {
  UserRepositoryInterface,
  UserRepositoryToken,
} from '@/domain/repositories/user.repository.interface';
// Infrastructure Layer Imports
import { DB } from '@/infrastructure/database/db';
import { UserRepository } from '@/infrastructure/database/repositories/user.repository';

// --- Dependency Registration ---

// Database Client
container.register('DrizzleClient', {
  useValue: DB,
});

// Repositories (Singleton)
container.register<UserRepositoryInterface>(UserRepositoryToken, UserRepository, {
  // 第2引数にクラス、第3引数にオプション
  lifecycle: Lifecycle.Singleton, // Singletonライフサイクルを指定
});

// Application Services / Usecases (Typically Transient or Scoped)
// import { CreateUserUsecase } from '@/application/usecases/user/CreateUserUsecase';
// container.register(CreateUserUsecase, { lifecycle: Lifecycle.Transient });

// --- Export Container ---

/**
 * アプリケーション全体で使用するDIコンテナインスタンス。
 * アプリケーションのエントリーポイント（API Routes, Server Actionsなど）で
 * このコンテナから必要なインスタンスを解決（resolve）して使用します。
 */
export { container };
