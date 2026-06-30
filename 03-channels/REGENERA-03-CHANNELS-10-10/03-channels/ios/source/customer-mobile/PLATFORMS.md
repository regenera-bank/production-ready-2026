# Android e iOS

Android e iOS compartilham domínio de interface, navegação e contratos em `customer-mobile`.

- Android: build EAS a partir desta fonte;
- iOS: build EAS a partir desta fonte;
- certificados, profiles e keystores: cofre da esteira;
- APK, AAB e IPA: registry de artefatos e lojas;
- configuração pública: `app.json` e `eas.json`;
- configuração secreta: variáveis protegidas do ambiente de build.

Duas bases nativas independentes criariam divergência funcional. Uma base compartilhada mantém paridade; código nativo entra apenas quando a plataforma exige.
