# Chaves e dados — Apple Store

| item | estado | ação |
|---|---|---|
| GoogleService-Info.plist | presente, porém vinculado a outro bundle | regenerar para o bundle oficial |
| Apple Distribution certificate + private key | ausente | criar no Apple Developer ou via EAS |
| provisioning profile | ausente | criar depois do App ID e capabilities |
| APNs Auth Key | ausente | criar se push for ativado |
| App Store Connect API key | ausente | criar para automação de upload/submissão |
| projeto Xcode recebido | presente como referência | não promover para fonte canônica sem auditoria |

Não se inventa certificado. A conta Apple é a autoridade. O pacote registra o que existe e o que falta.
