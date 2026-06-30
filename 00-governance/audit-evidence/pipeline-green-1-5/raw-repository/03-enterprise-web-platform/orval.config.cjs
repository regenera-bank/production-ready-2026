/**
 * [+] ENTERPRISE CORE SYSTEM :: v4.0.0
 * @project       :: Regenera Bank
 * @config        :: Orval React Query Generation (JS fallback)
 */
module.exports = {
  regenera_api: {
    input: process.env.ORVAL_SPEC_URL || 'https://regenera-core-api-520859662036.southamerica-east1.run.app/v1/api-docs-json', // remote 404 possible; CI: set ORVAL_SPEC_URL to local file or pre-generate generated/ before build (build script does not invoke orval)
    output: {
      mode: 'tags-split',
      target: 'src/shared/api/generated',
      schemas: 'src/shared/api/model',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: 'src/shared/api/client.ts',
          name: 'customAxiosInstance',
        },
        query: {
          useQuery: true,
          useInfinite: false,
          useMutation: true,
          options: {
            staleTime: 10000,
            retry: 2,
          }
        }
      },
    },
  },
};
