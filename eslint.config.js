import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

const browserGlobals = {
  document: 'readonly',
  window: 'readonly',
  localStorage: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  console: 'readonly',
  HTMLCanvasElement: 'readonly',
  HTMLElement: 'readonly',
  HTMLSelectElement: 'readonly',
  MouseEvent: 'readonly',
  TouchEvent: 'readonly',
  KeyboardEvent: 'readonly',
  WheelEvent: 'readonly',
  Element: 'readonly',
  Map: 'readonly',
  Set: 'readonly',
  JSON: 'readonly',
  Date: 'readonly',
  Math: 'readonly',
  Object: 'readonly',
  Array: 'readonly',
  String: 'readonly',
  Number: 'readonly',
  Boolean: 'readonly',
  RegExp: 'readonly',
  Error: 'readonly',
  Promise: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
  Blob: 'readonly',
  FileReader: 'readonly',
};

const nodeGlobals = {
  process: 'readonly',
  __dirname: 'readonly',
  module: 'readonly',
  require: 'readonly',
};

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parser: svelteParser,
      globals: {
        ...browserGlobals,
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $bindable: 'readonly',
        $inspect: 'readonly',
        $host: 'readonly',
      },
      parserOptions: {
        parser: ts.parser,
        project: './tsconfig.json',
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'off',
      'svelte/require-each-key': 'off',
      'svelte/prefer-writable-derived': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    ignores: ['**/*.svelte.ts'],
    languageOptions: {
      globals: { ...browserGlobals, ...nodeGlobals },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/__tests__/**', 'src/lib/game/core/Storage.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'node_modules/'],
  },
];
