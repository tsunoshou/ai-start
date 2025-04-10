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
        leadingUnderscore: 'allow',
      },
      // ★★★ 修正: エクスポートされた変数（関数型を含む）は camelCase を許可
      {
        selector: 'variable',
        modifiers: ['exported'],
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        filter: {
          regex: '.*(Page|Layout|Component|Provider|Context)$',
          match: false,
        },
      },
      // 変数のケース (UPPER_CASEを除外)
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
      // 一般的な関数宣言はcamelCaseのみ
      {
        selector: 'function',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
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
      },
      // 型名はPascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      // グローバル定数は大文字スネークケース
      {
        selector: 'variable',
        modifiers: ['const', 'global'], // export されていないトップレベルの const など
        format: ['UPPER_CASE'],
        filter: {
          // 既存の例外に加えて、末尾が Schema の変数を UPPER_CASE 強制から除外
          // さらに logger のような非プリミティブなオブジェクトも除外
          regex:
            '^(metadata|config|React|.*Schema|logger|.*[cC]lient|.*[sS]ervice|.*[rR]epository|.*[mM]apper)$',
          match: false,
        },
      },
      // loggerなどのオブジェクト変数に対する特別ルール
      {
        selector: 'variable',
        modifiers: ['const'],
        format: ['camelCase'],
        filter: {
          regex: '^(logger|.*[cC]lient|.*[sS]ervice|.*[rR]epository|.*[mM]apper)$',
          match: true,
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
      // ★★★ 追加: クラスプロパティ（メンバー）のルール
      {
        selector: 'classProperty',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      // ★★★ 追加: プライベートメンバーのルール (modifiers で指定)
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      // ★★★ 修正: HTTPヘッダー形式のプロパティのみ命名規則チェックを無効化 ★★★
      {
        selector: ['objectLiteralProperty'],
        filter: {
          // HTTPヘッダー形式 (例: Content-Type) にマッチする正規表現
          regex: '^([A-Z][a-zA-Z0-9]*(-[A-Z][a-zA-Z0-9]*)*)$',
          match: true,
        },
        // マッチしたプロパティ（HTTPヘッダー形式）については、命名規則チェックを適用しない
        format: null,
      },
      // ★★★ 注意: これより前のルールで camelCase が objectLiteralProperty に適用されている想定 ★★★
      // (デフォルトセレクタが camelCase を指定しているため、通常はこれでOK)
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
    // ロガー関連ファイルでのコンソール使用を許可
    {
      files: [
        '**/shared/logger/**/*.ts',
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx',
        '**/__tests__/**/*.spec.ts',
        '**/__tests__/**/*.spec.tsx',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
