# Auditoria técnica da entrada

## Evidência

- arquivo analisado: `Arquivo(4).zip`;
- SHA-256: `920230a5d16b7acf509a6e5fa52b3109db26d442bed2814176f325a5937d9a34`;
- entradas no arquivo: 39489;
- tamanho compactado: 329743091 bytes.

## Conteúdo aproveitável

- core NestJS com módulos de identidade, Pix, contabilidade, reconciliação, compliance e observabilidade;
- contratos e migrations que servem como referência de domínio;
- frontend com identidade visual e inventário dos 23 módulos;
- documentação operacional e pipelines que servem como entrada de arquitetura.

## Conteúdo não promovido

- `node_modules`, builds, binários e ZIPs aninhados;
- cliente React Native/Expo, porque a decisão do programa exige Android e iOS nativos;
- wrapper iOS WebView e instalador Windows/PWA;
- saldos, cartões, notificações e transações mockados;
- administração de cloud dentro do aplicativo bancário do cliente.

## Segurança

Foram detectados 68 caminhos com material potencialmente sensível, incluindo arquivo de ambiente, keystore e configurações de plataforma. Nenhum desses arquivos foi copiado. O material deve ser inventariado, revogado quando já exposto e substituído por secret manager, KMS/HSM e pipelines de assinatura segregados.

## Achado financeiro crítico

O core contém um value object monetário baseado em `BigInt`, mas também contém utilitário baseado em `number`/arredondamento. O código original não foi alterado. A correção deve ocorrer em mudança própria, acompanhada de testes de invariantes financeiros, migração de chamadas e aprovação de arquitetura/contabilidade.

## Raízes predominantes

- `__MACOSX`: 19653 entradas;
- `feito por claude e gtp`: 10498 entradas;
- `1.app-web-completo`: 7519 entradas;
- `1.regenera-corebank com pipiline`: 1715 entradas;
- `4.app-ios-incompleto`: 87 entradas;
- `2.app-android-incompleto`: 9 entradas;
- `3.app-desktop-incompleto`: 7 entradas;
- `build.sh`: 1 entradas;
