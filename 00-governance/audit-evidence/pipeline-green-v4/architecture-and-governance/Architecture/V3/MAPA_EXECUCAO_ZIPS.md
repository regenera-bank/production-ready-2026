# MAPA DE EXECUÇÃO — ZIPS V3

## Ordem certa

1. Salvar o pacote master.
2. Abrir backend.
3. Abrir frontend.
4. Abrir mobile.
5. Abrir infra.
6. Subir docs.
7. Publicar evidência.
8. Rodar pipeline.
9. Só então mexer em produção.

## Não fazer

- não colar segredo no código
- não subir `.env`
- não versionar `node_modules`
- não deixar Prometeo no frontend
- não esconder mock em service
- não trocar teste por print

Print mostra tela.
Teste prova contrato.
