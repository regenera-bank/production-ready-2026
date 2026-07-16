/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PARTNER_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}