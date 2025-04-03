import 'reflect-metadata';
// import { container, Lifecycle } from 'tsyringe'; // Lifecycle は未使用のため一時コメントアウト
import { container } from 'tsyringe'; // container のみインポート

// --- 基本的な依存関係の登録例 ---

// DBクライアント (例: Drizzle Client) - シングルトン
// import { db } from '@/infrastructure/database/db'; // db インスタンスをインポート
// container.register('DrizzleClient', { useValue: db });

// リポジトリインターフェースと実装の紐付け (トークン使用)
// import { IUserRepository } from '@/domain/repositories/IUserRepository';
// import { UserRepository } from '@/infrastructure/database/repositories/UserRepository';
// container.register<IUserRepository>('IUserRepository', {
//   useClass: UserRepository,
// });

// アプリケーションサービス/ユースケース
// import { CreateUserUsecase } from '@/application/usecases/user/CreateUserUsecase';
// container.register(CreateUserUsecase, { lifecycle: Lifecycle.Transient }); // ユースケースはリクエストごとに生成する場合など

// --- DIコンテナのエクスポート ---

/**
 * アプリケーション全体で使用するDIコンテナインスタンス。
 * アプリケーションのエントリーポイント（API Routes, Server Actionsなど）で
 * このコンテナから必要なインスタンスを解決（resolve）して使用します。
 */
export { container };
