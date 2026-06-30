# MISSÃO REGEBANK — AUDITORIA TOTAL, TRIAGEM GO-LIVE E BÍBLIA ARQUITETURAL

> Parte 1 é régua homologada.  
> Parte 2 funciona no Vercel e pipeline verde no GitHub.  
> O problema não é vitrine.  
> O problema é o interior ainda não carregar o mesmo metal.

Este pacote não tenta provar que a Parte 2 liga.  
Ela já liga.

Este pacote mostra o que precisa mudar para a Parte 2 virar sistema nosso: teste, tom, autoria, segurança, contrato e prova.

## MISSÃO 1 — SAST E GARGALOS

### Escopo varrido

| Pacote | Entradas ZIP | Arquivos fonte/config analisáveis | node_modules | __MACOSX |
|---|---:|---:|---:|---:|
| PARTE_1_HOMOLOGADA | 242 | 95 | 0 | 121 |
| PARTE_2_BACKEND | 49116 | 157 | 42805 | 655 |
| PARTE_2_MOBILE | 109214 | 52 | 100865 | 54579 |
| PARTE_2_FRONTEND | 115066 | 181 | 106428 | 57495 |
| PARTE_2_INFRA | 23 | 8 | 0 | 11 |
| PARTE_2_DOCS | 53 | 23 | 0 | 24 |
| PARTE_2_SOLTOS | 20 | 8 | 0 | 10 |
| PARTE_2_ARQUIVO_5 | 855 | 3 | 0 | 362 |
| GITHUB_PIPELINE_VERDE | 1194 | 417 | 0 | 597 |

### Achados por severidade

| Severidade | Total | Leitura |
|---|---:|---|
| CRITICO | 36 | segredo, URL sensível, token, private-key ou falso positivo que exige triagem humana |
| ALTO | 392 | mock, markdown em código, rota sem guard, SQL cru, arquitetura fraca |
| MEDIO | 49 | N+1 provável, leak provável, useEffect/timer/listener sem cleanup |
| BAIXO | 564 | console, TODO, comentário, dívida de limpeza |

### Top padrões encontrados

| Padrão | Total |
|---|---:|
| `mock_fake_demo` | 370 |
| `console_log` | 260 |
| `todo_markers` | 183 |
| `react_useeffect_deps` | 73 |
| `local_storage` | 48 |
| `timer_without_cleanup` | 28 |
| `loop_await` | 21 |
| `JWT_OR_SECRET_LITERAL` | 18 |
| `jwt_route_without_guard` | 17 |
| `DATABASE_URL_WITH_PASSWORD` | 6 |
| `PROMETEO_KEY_HINT` | 6 |
| `GOOGLE_API_KEY` | 6 |
| `markdown_fence_in_code` | 5 |

## Gargalos de arquitetura encontrados

### Backend

- Possível N+1 em trechos com `await` dentro de loop/map async. Isso precisa virar batch, join, relation loader ou query única.
- Controllers Nest com rota sem `@UseGuards` aparente. Pode ser público por design, mas rota pública precisa estar marcada. Rota silenciosamente pública é buraco.
- Mocks e tokens de teste aparecem próximos de auth e deploy. Se for teste, isola em `test/`. Se toca runtime, morre.
- Scripts de deploy manual continuam presentes. Deploy manual é atalhos com pólvora.

### Frontend React/Vercel

- `useEffect` sem dependências claras em múltiplas telas. Pode re-renderizar demais ou buscar dados em loop.
- Listeners/timers sem cleanup aparente. Leak de UI não sangra no primeiro clique. Sangra depois de uma sessão longa.
- API client existe e usa Firebase IdToken. Isso é bom. Mas endpoint hardcoded e fallback precisam ser governados por env pública controlada.
- Prometeo no frontend está blindado/deprecated. Direção correta: só backend proxy. Qualquer import direto vira erro de segurança.

### Mobile

- Expo real e telas existem, mas teste é fraco perto do risco da borda.
- AsyncStorage/Firebase/local storage precisam de triagem: token e segredo não moram em gaveta aberta.
- Biometrics precisa sequence testado: biometria faz step-up local, backend decide operação.

### Infra

- Existe direção forte: Cloud Run, GKE, Argo, Cloud Armor, DNS, IAM.
- Precisa unir isso a evidência: CI, Terraform/manifest, política de secrets, rollout e rollback.

## SAST sem medo

- Segredos encontrados foram redigidos no relatório. Valor sensível não se repete em auditoria.
- Firebase web API key pode ser pública em alguns contextos, mas precisa restrição, App Check e regra forte. Chave pública sem restrição vira chaveiro na calçada.
- Database URL com senha em `.env`, README ou script é incidente de higiene. Não precisa drama. Precisa rotação e remoção.
- Secret de CI mock está permitido só se for claramente mock e nunca usado para produção.

## Evidência bruta

- Inventário: `evidence/ARTEFATOS_INVENTARIO.csv`
- SAST JSON: `evidence/SAST_FINDINGS_REDACTED.json`
- Triagem arquivo a arquivo: `evidence/GO_LIVE_FILE_TRIAGE.csv`

## Frase da missão 1

Auditoria não é caça ao defeito.  
É tirar a fantasia do sistema.

Parte 2 funciona.  
Agora precisa parar de parecer vitrine bonita com fios soltos atrás.
