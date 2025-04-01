const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.jsのアプリケーションへのパスを指定
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // テストファイルのパターン
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  // テスト環境
  testEnvironment: 'jest-environment-jsdom',
  // カバレッジ設定
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!next.config.js',
  ],
  // モジュールのモック
  moduleNameMapper: {
    // パスエイリアスの設定
    '^@/(.*)$': '<rootDir>/$1',
  },
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // テスト対象外のディレクトリ
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/coverage/'],
  // 変換設定
  transform: {
    // TypeScriptファイルの変換設定
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
