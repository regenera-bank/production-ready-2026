# Bloqueios Externos — Channel Persistence

| Item                      | Provider                 | Status       | Nota                                   |
|---------------------------|--------------------------|--------------|----------------------------------------|
| Object storage produção   | GCS / S3 + KMS           | PENDENTE     | Sandbox: `DocumentObjectStore` em `DOCUMENT_VAULT_PATH` |
| HSM / KMS                 | AWS CloudHSM + KMS       | PENDENTE     | Credenciais institucionais             |
| Antimalware upload        | ClamAV / Cloud AV        | PENDENTE     | Scan antes de persistir blob          |
| Presigned URL ICP         | AC + token físico        | PENDENTE     | Upload direto canal → vault           |
| DR exercitado             | Ambiente de DR           | PENDENTE     | RTO medido, relatório assinado         |
| Pentest externo           | Empresa especializada    | PENDENTE     | Relatório + mitigação                  |

## Sandbox homolog (implementado)

- Blobs KYC: `domains/channel-persistence/src/journey/document-object-store.ts`
- Metadados: `channel_experience.document_assets` (V001)
- Extrato: `channel_experience.transaction_projections` + leitura async no BFF

Produção exige GCS/S3 com KMS e política de retenção LGPD antes de declarar ativo.