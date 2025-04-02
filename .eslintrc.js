module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
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
          regex: '^(metadata|config)$',
          match: false,
        },
      },
      // enumメンバーはPascalCase
      {
        selector: 'enumMember',
        format: ['PascalCase'],
      },
      // 外部ライブラリのパラメータとして使用されるObjectLiteral内のスネークケースプロパティを許可
      {
        selector: 'objectLiteralProperty',
        format: null,
        filter: {
          regex:
            '^(idle_timeout|connect_timeout|statement_timeout|max_lifetime|x-application-name)$',
          match: true,
        },
      },
      // 定数オブジェクトのプロパティは大文字スネークケースを許可
      {
        selector: 'property',
        format: ['UPPER_CASE', 'camelCase'],
        filter: {
          regex: '^[A-Z][A-Z0-9_]*$',
          match: true,
        },
      },
      // HTTPヘッダー名のハイフン区切りを許可
      {
        selector: 'objectLiteralProperty',
        format: null,
        filter: {
          regex: '^[a-z]+-[a-z-]+$',
          match: true,
        },
      },
      // APIパラメータ名のアンダースコア区切りを許可
      {
        selector: 'parameter',
        format: null,
        filter: {
          regex: '^[a-z]+_[a-z_]+$',
          match: true,
        },
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
};
