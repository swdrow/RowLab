import js from '@eslint/js';
import globals from 'globals';
import tseslintParser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-v4/**',
      'build/**',
      '.next/**',
      'coverage/**',
      'server/python-services/**',
      '.worktrees/**',
    ],
  },

  // Base recommended rules
  js.configs.recommended,

  // TypeScript files - use @typescript-eslint/parser
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      parser: tseslintParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules
      ...tseslintPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off', // Disable base rule in favor of TS version
      // Disable no-undef for TS files -- @typescript-eslint handles undefined
      // references via type checking; the base no-undef rule doesn't understand
      // TypeScript type namespaces (e.g., React.ComponentPropsWithoutRef).
      'no-undef': 'off',

      // React rules
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // React Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,
      // React Compiler rules -- demote to warnings. These are aspirational
      // optimizations (avoid setState in effects, inline useMemo callbacks,
      // don't create components during render) but many existing patterns are
      // intentional and safe. Will address incrementally.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',

      // jsx-a11y recommended rules
      ...jsxA11yPlugin.flatConfigs.recommended.rules,
      // Allow autoFocus in modals/dialogs -- standard UX pattern for focus
      // management when a dialog opens (WAI-ARIA dialog pattern).
      'jsx-a11y/no-autofocus': 'off',
      // Demote to warning: most labels either nest their control directly or use
      // react-hook-form register() which handles association dynamically.
      // Will add explicit htmlFor/id bindings incrementally.
      'jsx-a11y/label-has-associated-control': 'warn',

      // Project defaults
      'no-console': 'off',
    },
  },

  // JavaScript files - keep default espree parser
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // React Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // jsx-a11y recommended rules
      ...jsxA11yPlugin.flatConfigs.recommended.rules,

      // Relax some rules for existing codebase
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
];
