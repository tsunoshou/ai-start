import '@testing-library/jest-dom/vitest'; // Vitestでjest-domのマッチャーを使えるようにする
import { beforeAll, afterEach, afterAll } from 'vitest';

// テスト全体のセットアップ (必要に応じて)
beforeAll(() => {
  // 例: テスト前に一度だけ実行する処理
});

// 各テストケース後のクリーンアップ (必要に応じて)
afterEach(() => {
  // 例: モックのリセットなど
});

// テスト全体のクリーンアップ (必要に応じて)
afterAll(() => {
  // 例: サーバーのシャットダウンなど
});
