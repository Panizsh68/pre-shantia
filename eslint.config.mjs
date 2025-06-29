import eslintPlugin from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  eslintPlugin.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 2021,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      // Best practices
      eqeqeq: ['error', 'always'], // الزام به استفاده از ===
      curly: ['error', 'all'], // تمام بلاک‌ها باید آکولاد داشته باشن
      'no-multi-spaces': 'error',
      'no-return-await': 'error',

      // Typescript-specific
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // جلو استفاده بی‌رویه از any رو بگیره
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // همه جا interface استفاده کن
      '@typescript-eslint/explicit-function-return-type': ['warn'], // بهتره type فانکشن مشخص باشه
      '@typescript-eslint/no-inferrable-types': 'warn', // از تعریف اضافی نوع جلوگیری کن

      // Clean code
      // 'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],

      // Turn off conflicting base rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      strict: 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
