import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['node_modules', 'android', 'ios', 'build', 'dist']
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}', 'metro.config.cjs', 'babel.config.cjs'],

    languageOptions: {
      sourceType: 'commonjs',
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },

    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      import: importPlugin,
      'simple-import-sort': simpleImportSort
    },

    settings: {
      react: {
        version: 'detect'
      }
    },

    rules: {
      // ✅ Import sorting
      'simple-import-sort/imports': [
        'error',
        {
          groups: [['^']] // 👈 no blank lines at all
        }
      ],
      'simple-import-sort/exports': 'error',

      'import/no-duplicates': 'error',

      // ✅ React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // ✅ Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ✅ React Native
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'off',

      // ✅ TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // ✅ General
      'no-console': 'warn'
    }
  },
  {
    files: ['metro.config.js', 'babel.config.js'],
    languageOptions: {
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
];
