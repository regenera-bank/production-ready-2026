 1 // [FILE] .eslintrc.js
     2 // ESLint Configuration for Regenera Bank Monorepo (TypeScript, React, Node.js)
     3 // Desenvolvedor: Don Paulo Ricardo
     4 // Regra 3.1: Padrões de Codificação
     5 
     6 module.exports = {
     7   env: {
     8     node: true,
     9     jest: true,
    10     es2021: true,
    11     browser: true, // Para projetos React/Next.js
    12   },
    13   extends: [
    14     'eslint:recommended',
    15     'plugin:@typescript-eslint/recommended',        // Regras recomendadas para TypeScript
    16     'plugin:react/recommended',                     // Regras recomendadas para React
    17     'plugin:react-hooks/recommended',               // Regras para Hooks do React
    18     'plugin:jsx-a11y/recommended',                  // Regras de acessibilidade para JSX
    19     'plugin:prettier/recommended',                  // Integração com Prettier
    20   ],
    21   parser: '@typescript-eslint/parser',              // Parser para TypeScript
    22   parserOptions: {
    23     ecmaVersion: 2021,
    24     sourceType: 'module',
    25     project: './tsconfig.json',                     // Habilita regras type-aware
    26     ecmaFeatures: {
    27       jsx: true,                                    // Habilita parsing de JSX
    28     },
    29   },
    30   plugins: [
    31     '@typescript-eslint',
    32     'react',
    33     'react-hooks',
    34     'jsx-a11y',
    35     'prettier',
    36   ],
    37   rules: {
    38     // Regras gerais
    39     'indent': 'off', // Conflita com Prettier, desativado
    40     'linebreak-style': ['error', 'unix'],
    41     'quotes': ['error', 'single'],
    42     'semi': ['error', 'always'],
    43 
    44     // Regras do Prettier
    45     'prettier/prettier': 'error',
    46 
    47     // Regras específicas do TypeScript
    48     '@typescript-eslint/interface-name-prefix': 'off',
    49     '@typescript-eslint/explicit-function-return-type': 'off', // Pode ser 'error' para maior rigidez
    50     '@typescript-eslint/explicit-module-boundary-types': 'off', // Pode ser 'error' para maior rigidez
    51     '@typescript-eslint/no-explicit-any': 'warn',   // Apenas aviso para 'any', pode ser 'error'
    52     '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignora variáveis prefixadas com _
    53     '@typescript-eslint/prefer-optional-chain': 'error',
    54     '@typescript-eslint/prefer-nullish-coalescing': 'error',
    55     '@typescript-eslint/no-non-null-assertion': 'warn',
    56 
    57     // Regras específicas do React
    58     'react/react-in-jsx-scope': 'off', // Não é necessário com Next.js 17+ / React 17+ JSX transform
    59     'react/prop-types': 'off',         // Desativado, pois TypeScript faz a validação de props
    60     'react/display-name': 'off',       // Desativado se usar React.memo ou forwardRef
    61     'react/self-closing-comp': ['error', {
    62       component: true,
    63       html: true
    64     }],
    65 
    66     // Regras de acessibilidade JSX
    67     'jsx-a11y/anchor-is-valid': ['error', {
    68       components: ['Link'],
    69       specialLink: ['hrefLeft', 'hrefRight'],
    70       aspects: ['invalidHref', 'preferButton'],
    71     }],
    72 
    73     // Outras regras
    74     'no-console': ['warn', { allow: ['warn', 'error'] }], // Permitir console.warn e console.error
    75     'no-debugger': 'error',
    76   },
    77   settings: {
    78     react: {
    79       version: 'detect', // Detecta a versão do React automaticamente
    80     },
    81   },
    82   ignorePatterns: [
    83     'node_modules/',
    84     'dist/',
    85     'build/',
    86     '.next/',
    87     'coverage/',
    88     '*.js', // Ignora arquivos JS na raiz ou fora de src/
    89   ],
    90   overrides: [
    91     {
    92       files: ['*.js'],
    93       rules: {
    94         '@typescript-eslint/no-var-requires': 'off', // Permite require em arquivos JS
    95       },
    96     },
    97     {
    98       files: ['*.ts', '*.tsx'],
    99       parserOptions: {
   100         project: ['./tsconfig.json'], // Certifique-se de que o projeto TS está configurado corretamente
   101       },
   102     },
   103   ],
   104 };
