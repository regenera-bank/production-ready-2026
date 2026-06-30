# Bloqueios Externos — Core Banking

| Item                      | Provider                 | Status       | Nota                                   |
|---------------------------|--------------------------|--------------|----------------------------------------|
| HSM / KMS                 | AWS CloudHSM + KMS       | PENDENTE     | Credenciais institucionais             |
| IAM institucional         | AWS IAM + GKE Workload   | PENDENTE     | Conta corporativa necessária           |
| Certificado ICP-Brasil A3 | AC Serasa / Válid        | PENDENTE     | PJ + token físico                      |
| Homologação SPI/DICT      | BACEN                    | PENDENTE     | Participação direta exige licença IP   |
| Licença IP Res. 80/2021   | BACEN                    | PENDENTE     | Processo + patrimônio mínimo           |
| Licença SCD Res. 4.656    | BACEN                    | PENDENTE     | Processo adicional para crédito        |
| Parecer jurídico          | Advogado especializado   | PENDENTE     | Interpretação de Res. BACEN            |
| SOC / SIEM                | Datadog Security         | PENDENTE     | Contrato + integração                  |
| DR exercitado             | Ambiente de DR           | PENDENTE     | RTO medido, relatório assinado         |
| Banco correspondente      | Parceiro bancário        | PENDENTE     | Conta de liquidação + acordos          |
| Pentest externo           | Empresa especializada    | PENDENTE     | Relatório + mitigação                  |
| Revisão independente      | Auditor externo          | PENDENTE     | Quem fez não aprova                    |

Essa distinção é parte do produto.

Baseline comprova: implementado + verificado localmente.

Produção exige os itens acima.