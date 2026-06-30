// [FILE] .eslintrc.js
// ESLint Configuration for Regenera Bank Monorepo (TypeScript, React, Node.js)
// Desenvolvedor: Don Paulo Ricardo
// Regra 3.1: Padrões de Codificação

module.exports = {
  env: {
    node: true,
    jest: true,
    es2021: true,
    browser: true, // Para projetos React/Next.js
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',        // Regras recomendadas para TypeScript
    'plugin:react/recommended',                     // Regras recomendadas para React
    'plugin:react-hooks/recommended',               // Regras para Hooks do React
    'plugin:jsx-a11y/recommended',                  // Regras de acessibilidade para JSX
    'plugin:prettier/recommended',                  // Integração com Prettier
  ],
  parser: '@typescript-eslint/parser',              // Parser para TypeScript
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',                     // Habilita regras type-aware
    ecmaFeatures: {
      jsx: true,                                    // Habilita parsing de JSX
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'prettier',
  ],
  rules: {
    // Regras gerais
    'indent': 'off', // Conflita com Prettier, desativado
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],

    // Regras do Prettier
    'prettier/prettier': 'error',

    // Regras específicas do TypeScript
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off', // Pode ser 'error' para maior rigidez
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Pode ser 'error' para maior rigidez
    '@typescript-eslint/no-explicit-any': 'warn',   // Apenas aviso para 'any', pode ser 'error'
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignora variáveis prefixadas com _
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Regras específicas do React
    'react/react-in-jsx-scope': 'off', // Não é necessário com Next.js 17+ / React 17+ JSX transform
    'react/prop-types': 'off',         // Desativado, pois TypeScript faz a validação de props
    'react/display-name': 'off',       // Desativado se usar React.memo ou forwardRef
    'react/self-closing-comp': ['error', {
      component: true,
      html: true
    }],

    // Regras de acessibilidade JSX
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['hrefLeft', 'hrefRight'],
      aspects: ['invalidHref', 'preferButton'],
    }],

    // Outras regras
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Permitir console.warn e console.error
    'no-debugger': 'error',
  },
  settings: {
    react: {
      version: 'detect', // Detecta a versão do React automaticamente
    },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '*.js', // Ignora arquivos JS na raiz ou fora de src/
  ],
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off', // Permite require em arquivos JS
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.json'], // Certifique-se de que o projeto TS está configurado corretamente
      },
    },
  ],
};