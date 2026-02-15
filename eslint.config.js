import js from '@eslint/js';
import globals from 'globals';
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

  // React settings for all JS/JSX/TS/TSX files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
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
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
      'react/prop-types': 'off', // Using TypeScript for prop validation

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
