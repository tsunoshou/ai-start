import 'reflect-metadata';
import { container } from 'tsyringe'; // Lifecycle のインポートを削除

// --- 基本的な依存関係の登録例 ---

// DBクライアント (Drizzle Client) - シングルトン性は db.ts の実装で担保
import { DB } from '@/infrastructure/database/db'; // エクスポート名に合わせて DB をインポート
container.register('DrizzleClient', {
  useValue: DB, // インポートした DB を使用
});

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
