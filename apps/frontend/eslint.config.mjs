import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'next-env.d.ts',
      'src/components/auth-boss0exe/**',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: {
      '@next/next': nextPlugin,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // Plugins are registered for inline eslint-disable comments; keep checks relaxed.
      '@next/next/no-img-element': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'warn',
      'no-useless-escape': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['**/*.{mjs,cjs}', 'next.config.mjs', 'postcss.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
