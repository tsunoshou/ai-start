module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // 基本的なルール
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    
    // インポート順序
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type'
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        },
        pathGroups: [
          {
            pattern: '{react,react-dom/**,react-router-dom}',
            group: 'builtin',
            position: 'before'
          },
          {
            pattern: '@/app/**',
            group: 'internal',
            position: 'before'
          },
          {
            pattern: '@/domain/**',
            group: 'internal',
            position: 'before'
          },
          {
            pattern: '@/application/**',
            group: 'internal',
            position: 'before'
          },
          {
            pattern: '@/infrastructure/**',
            group: 'internal',
            position: 'after'
          },
          {
            pattern: '@/presentation/**',
            group: 'internal',
            position: 'after'
          },
          {
            pattern: '@/shared/**',
            group: 'internal',
            position: 'after'
          }
        ]
      }
    ],
    
    // TypeScript固有のルール
    '@typescript-eslint/explicit-function-return-type': ['warn', { 
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
    
    // Next.js特有のルール
    '@next/next/no-html-link-for-pages': 'off',
    
    // ドメイン層の依存関係チェック（カスタムルール）
    // 注: カスタムプラグインはこのプロジェクトに含まれていません
    // 'domain-dependency/no-infra-import': 'error',
    // 'domain-dependency/no-presentation-import': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    }
  },
  ignorePatterns: [
    'node_modules/*',
    '.next/*',
    'out/*',
    'public/*',
    'next.config.js',
    '*.config.js',
    '*.setup.js'
  ]
} 