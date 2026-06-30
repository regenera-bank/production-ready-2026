# Gate de identidade, Firebase e assinatura iOS

## Identidades encontradas

- fonte Expo: `app.regenerabank.mobile`;
- projeto PWABuilder/Xcode recebido: `app.vercel.11-0-regenera-corporate-we-bank-we`;
- `GoogleService-Info.plist`: deve ser validado no Firebase Console antes de ser anexado a qualquer target.

## Regra

Não altere o bundle identifier por busca e substituição. Primeiro determine qual App ID existe no Apple Developer e qual registro existe no App Store Connect.

## Materiais externos ausentes

- certificado de distribuição e chave privada;
- provisioning profile compatível;
- App Store Connect API key `.p8` ou sessão autenticada;
- confirmação do Firebase iOS App correspondente ao bundle oficial.

## Classificação

**Bloqueado por certificado, identidade e validação externa.** O projeto foi endurecido estaticamente, mas não foi assinado nem submetido.
