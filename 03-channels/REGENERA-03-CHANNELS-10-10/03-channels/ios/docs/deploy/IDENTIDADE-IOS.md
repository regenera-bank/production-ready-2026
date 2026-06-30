# Identidade iOS

| origem | identificador |
|---|---|
| fonte Expo atual | `app.regenerabank.mobile` |
| projeto Xcode recebido | `app.vercel.11-0-regenera-corporate-we-bank-we` |
| Firebase plist recebido | `com.microsoft.pwabuilder-ios` |

## Regra

O bundle identifier do App Store Connect, do build, dos entitlements e do Firebase precisa ser o mesmo. O material recebido não atende essa igualdade hoje.

## Ação

1. Defina o bundle oficial no App Store Connect.
2. Ajuste `source/customer-mobile/app.json` somente se o registro oficial usar outro bundle.
3. Crie/associe o app iOS correto no Firebase.
4. Baixe um novo `GoogleService-Info.plist` para o bundle oficial.
5. Gere certificados e profiles pelo Apple Developer/Xcode ou deixe o EAS gerenciá-los.
