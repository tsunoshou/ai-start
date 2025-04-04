module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:storybook/recommended',
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // 基本的なルール
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // インポート順序のルール
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],

    // React関連のルール
    'react/jsx-sort-props': [
      'warn',
      {
        callbacksLast: true,
        shorthandFirst: true,
        ignoreCase: true,
        reservedFirst: true,
      },
    ],

    // 命名規則のルール
    '@typescript-eslint/naming-convention': [
      'error',
      // デフォルトケース
      {
        selector: 'default',
        format: ['camelCase'],
      },
      // 変数のケース
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
      },
      // 一般的な関数名はcamelCaseのみ
      {
        selector: 'function',
        format: ['camelCase'],
      },
      // Reactコンポーネント関数（app/ ディレクトリ内の関数）はPascalCaseを許可
      {
        selector: 'function',
        filter: {
          // app/ ディレクトリ内のページ/レイアウトコンポーネントに一致
          regex: '^.+/(page|layout|loading|error|template|not-found)\\.[jt]sx?$',
          match: true,
        },
        format: ['PascalCase'],
      },
      // presentation/components/ ディレクトリ内の関数はPascalCaseを許可
      {
        selector: 'function',
        filter: {
          regex: '^.+/components/.+\\.[jt]sx?$',
          match: true,
        },
        format: ['PascalCase'],
      },
      // components/ui/ ディレクトリ内の関数はPascalCaseを許可（Shadcn/UI用）
      {
        selector: 'function',
        filter: {
          regex: '^.+/components/ui/.+\\.[jt]sx?$',
          match: true,
        },
        format: ['PascalCase', 'camelCase'],
      },
      // components/ui/ ディレクトリ内の変数はPascalCase, camelCaseを許可（Shadcn/UI用）
      {
        selector: 'variable',
        filter: {
          regex: '^.+/components/ui/.+\\.[jt]sx?$',
          match: true,
        },
        format: ['PascalCase', 'camelCase', 'UPPER_CASE'],
      },
      // .tsx ファイル内の大文字で始まる関数はPascalCaseを許可
      {
        selector: 'function',
        filter: {
          regex: '^[A-Z].+$',
          match: true,
        },
        format: ['PascalCase'],
      },
      // インターフェース名はIプレフィックスなし
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      // 型名はPascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      // グローバル定数は大文字スネークケース
      {
        selector: 'variable',
        modifiers: ['const', 'global'],
        format: ['UPPER_CASE'],
        filter: {
          regex: '^(metadata|config|React)$',
          match: false,
        },
      },
      // Reactのようなライブラリインポートは例外として許可
      {
        selector: 'import',
        format: ['camelCase', 'PascalCase'],
      },
      // enumメンバーはPascalCase
      {
        selector: 'enumMember',
        format: ['PascalCase'],
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  // .eslintrc.jsファイル自体を検証対象から除外
  ignorePatterns: ['.eslintrc.js'],
  // コンポーネントライブラリのファイルに対する特別なルール
  overrides: [
    {
      files: ['**/components/ui/**/*.{ts,tsx}', '**/presentation/components/ui/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'default',
            format: ['camelCase', 'PascalCase'],
            filter: {
              regex: '^_.*|.*_.*',
              match: false,
            },
          },
          {
            selector: 'objectLiteralProperty',
            format: null,
            filter: {
              regex: '.*_.*',
              match: true,
            },
          },
          {
            selector: 'variable',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          },
          {
            selector: 'function',
            format: ['camelCase', 'PascalCase'],
          },
          {
            selector: 'parameter',
            format: ['camelCase', 'PascalCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'typeLike',
            format: ['PascalCase'],
          },
        ],
      },
    },
    {
      files: ['**/presentation/hooks/use-toast.ts'],
      rules: {
        '@typescript-eslint/naming-convention': 'off',
      },
    },
  ],
};
