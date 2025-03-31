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
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // インポート順序のルール
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' }
      }
    ],
    
    // React関連のルール
    'react/jsx-sort-props': ['warn', {
      callbacksLast: true,
      shorthandFirst: true,
      ignoreCase: true,
      reservedFirst: true
    }],
    
    // 命名規則のルール
    '@typescript-eslint/naming-convention': [
      'error',
      // インターフェース名はIプレフィックスなし
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false
        }
      },
      // 型名はPascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase']
      },
      // 定数は大文字スネークケース
      {
        selector: 'variable',
        modifiers: ['const', 'global'],
        format: ['UPPER_CASE'],
        regex: '^[A-Z][A-Z0-9_]*$'
      },
      // enumメンバーはPascalCase
      {
        selector: 'enumMember',
        format: ['PascalCase']
      }
    ]
  },
  settings: {
    'import/resolver': {
      typescript: {}
    }
  }
}; 