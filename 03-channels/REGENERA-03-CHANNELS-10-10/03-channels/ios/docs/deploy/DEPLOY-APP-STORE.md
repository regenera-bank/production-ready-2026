# Deploy Apple Store — passo a passo

## 1. Conta e identidade

1. Entre no Apple Developer e App Store Connect com função adequada.
2. Crie ou abra o registro do aplicativo.
3. Confirme o bundle identifier oficial.
4. A fonte atual usa `app.regenerabank.mobile`.

## 2. Certificados e profiles

Nenhum certificado Apple, private key, provisioning profile ou API key foi encontrado nos arquivos recebidos. Eles precisam ser criados na conta Apple correta.

Com EAS:

```bash
cd source/customer-mobile
npm ci
npx eas-cli@latest login
npx eas-cli@latest credentials --platform ios
npx eas-cli@latest build --platform ios --profile production
```

O EAS pode gerenciar certificado e profile, desde que a conta e o bundle estejam corretos.

## 3. Firebase e push

O `GoogleService-Info.plist` recebido foi preservado em `credentials/firebase/`, mas declara `com.microsoft.pwabuilder-ios`. Gere outro arquivo para o bundle oficial antes de ativar push, analytics ou autenticação Firebase.

Para APNs, crie uma APNs Auth Key ou certificado Apple Push Services e armazene no cofre da esteira.

## 4. TestFlight

1. Faça upload do build via EAS Submit, Xcode ou Transporter.
2. Aguarde o processamento no App Store Connect.
3. Distribua primeiro no TestFlight interno.
4. Valide biometria, câmera, notificações, deep links, background modes, políticas e exclusão de conta.

```bash
npx eas-cli@latest submit --platform ios --profile production
```

## 5. App Review

- preencha descrição, screenshots, privacy nutrition labels e classificação etária;
- selecione o build processado;
- informe conta de demonstração quando exigida;
- responda sobre criptografia;
- submeta para revisão.

## 6. Rollback

Uma versão publicada não é substituída por binário anterior. Use phased release, feature flags, kill switches e envie uma nova versão corretiva.

## Links oficiais

- Criar registro do app: https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app
- Fazer upload de builds: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds
- Escolher build: https://developer.apple.com/help/app-store-connect/manage-builds/choose-a-build-to-submit
- Submeter para App Review: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app
- Certificados: https://developer.apple.com/help/account/create-certificates/certificates-overview
