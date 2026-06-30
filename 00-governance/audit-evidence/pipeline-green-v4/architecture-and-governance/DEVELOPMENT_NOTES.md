# Development Notes & Technical Debt

**Version:** 4.0.0
**Author:** Don Paulo Ricardo

## Known Issues (Tech Debt)
- **Backend Build Typings:** O build `npm run build` do backend apresenta avisos de compilação do TypeScript devido a dependências ausentes (ex: `@types/supertest`) e refatorações de métodos pendentes no `PixService` e `OpenFinanceService`. A lógica de negócio está intacta, sendo apenas um problema de assinatura de tipos.
- **Middleware Cleanup:** O `AuditMetadataMiddleware` (anteriormente `metadata-injector`) foi refatorado e isolado na arquitetura, mas precisará ser injetado ativamente no fluxo de requests do `AppModule` em sprints futuras.
- **Strict Mode no React:** O ambiente de desenvolvimento do Frontend Vite está acionando double-renders (comportamento padrão de debug do `React.StrictMode`), mas não afeta a compilação final.
