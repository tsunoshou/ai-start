import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { container } from 'tsyringe';

import { ENV } from '@/config/environment';
import * as schema from '@/infrastructure/database/schema'; // スキーマ定義をインポート
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

// PostgreSQL クライアントインスタンスを作成
// 接続文字列を直接使用
// eslint-disable-next-line @typescript-eslint/naming-convention
const QUERY_CLIENT = postgres(ENV.DATABASE_URL, {
  // 必要に応じて postgres の追加オプションをここに記述
  onnotice: (notice) => logger.info(`Postgres Notice: ${notice.message}`),
  debug:
    ENV.NODE_ENV === 'development'
      ? (connection, query, parameters, paramTypes) => {
          // logger.debug の引数の順序を修正
          logger.debug({
            message: 'Executing SQL Query',
            query,
            parameters,
            paramTypes
          });
        }
      : undefined,
});

// Drizzle ORM クライアントインスタンスを作成
// スキーマ全体を渡す
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DB = drizzle(QUERY_CLIENT, { schema, logger: ENV.NODE_ENV === 'development' });

logger.info('Drizzle ORM client initialized.');
