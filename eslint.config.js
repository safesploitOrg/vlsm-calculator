const rules = {
  'no-undef': 'error',
  'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'no-unreachable': 'error',
  'no-constant-condition': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'eqeqeq': ['error', 'always'],
  'curly': ['error', 'all']
};

export default [
  {
    ignores: ['node_modules/**']
  },
  {
    files: ['public/assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        Blob: 'readonly',
        DataView: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        TextEncoder: 'readonly',
        Uint8Array: 'readonly',
        URL: 'readonly',
        window: 'readonly'
      }
    },
    rules
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        DataView: 'readonly',
        process: 'readonly',
        TextDecoder: 'readonly'
      }
    },
    rules
  }
];
