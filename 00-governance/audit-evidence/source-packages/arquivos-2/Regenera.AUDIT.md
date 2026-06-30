# AUDITORIA INDEPENDENTE — RASTREABILIDADE MATEMÁTICA

Neste banco, auditoria não começa em PDF.

PDF é relato.
Dashboard é vitrine.
Frontend é teatro se o ledger não fecha.

Auditoria de verdade recalcula.

Linha por linha.
Conta por conta.
Hash por hash.
Débito contra crédito.
Evento contra lançamento.
Pix contra ledger.
Outbox contra mundo externo.

A matemática não tem opinião.
Mas ela tem memória.

---

## 1. O que está sendo auditado

O alvo da auditoria é o ledger.

No mínimo:

* `ledger_entries`
* `ledger_lines`
* `ledger_accounts`
* `pix_payments`
* `outbox_events`

Se existir trilha externa, também entra:

* eventos publicados no gateway
* recibos de liquidação
* callbacks recebidos
* identificadores de correlação
* snapshots readonly
* dumps assinados ou armazenados fora do banco principal

Auditoria não pergunta se o sistema “acha” que está certo.

Auditoria pega o que foi gravado e reconstrói.

Se reconstruir e fechar, o banco tem chão.
Se não fechar, alguém está vendendo fumaça com timestamp.

---

## 2. Regra de ouro

Ledger não se corrige com `UPDATE`.

Ledger não se limpa com `DELETE`.

Ledger não “ajusta depois” apagando o erro.

Erro contábil vira novo lançamento.
Falha operacional vira evento.
Divergência vira caso.
Violação vira incidente.

Quem altera o passado para parecer certo não corrigiu o banco.

Só queimou a prova.

---

## 3. Garantia criptográfica do ledger

As linhas do ledger são encadeadas por hash criptográfico.

Cada linha carrega:

* `previous_hash`
* dados contábeis da linha
* `line_hash`

A regra é simples:

o `previous_hash` da linha atual precisa bater com o `line_hash` da linha anterior da mesma conta.

Depois disso, o auditor recalcula o hash da linha atual usando os mesmos campos definidos pelo banco.

Se o valor recalculado não bater com o `line_hash` armazenado, a linha perdeu integridade.

Não importa se o saldo parece correto.
Não importa se o relatório ficou bonito.
Não importa se o operador jura que foi “só correção”.

Hash quebrado é cicatriz aberta.

---

## 4. O dump readonly

O auditor deve trabalhar sobre dump readonly.

Dump sem escopo é ruído.
Dump sem snapshot é foto tremida.
Dump sem horário de extração é lembrança.
Dump alterável é piada com crachá.

O pacote mínimo de auditoria precisa informar:

* período auditado;
* horário de extração;
* origem do dump;
* responsável técnico;
* hash do próprio dump;
* versão das migrations;
* commit da aplicação;
* ambiente de origem;
* critérios de seleção dos registros.

Sem isso, a auditoria começa torta.

E auditoria que começa torta termina em reunião longa.

---

## 5. O que o auditor deve procurar

### 5.1 Quebra de hash

Sinal:

`previous_hash` da linha N não bate com `line_hash` da linha N-1.

Leitura:

A cadeia foi rompida.

Pode ser bug.
Pode ser DBA.
Pode ser migration ruim.
Pode ser tentativa de reescrever passado.

O primeiro nome disso é violação.

A causa vem depois.

---

### 5.2 Hash recalculado diferente

Sinal:

O auditor recalcula o hash da linha atual e o resultado não bate com `line_hash`.

Leitura:

A linha foi alterada, ou o algoritmo usado para gravar não é o mesmo usado para auditar.

Os dois casos são graves.

Se o dado muda e o hash não acompanha, alguém tocou no que não devia.
Se o algoritmo muda sem versão, a auditoria fica sem régua.

Ledger sem régua vira opinião com SHA256.

---

### 5.3 Furo de sequência

Sinal:

Sequência pulada, duplicada ou fora de ordem dentro da conta.

Leitura:

A linha do tempo foi ferida.

Dinheiro precisa de ordem.
Sem ordem, não existe reconstrução.
Sem reconstrução, não existe confiança.

---

### 5.4 Saldo fantasma

Sinal:

A soma de débitos e créditos de uma `ledger_entry` não fecha em zero.

Leitura:

O sistema criou dinheiro do nada ou jogou dinheiro no ralo.

Partida dobrada não é decoração acadêmica.
É a trava que impede o banco de alucinar saldo.

Se uma entrada contábil não fecha, o banco não está “quase certo”.

Está errado.

---

### 5.5 Classe contábil ignorada

Sinal:

Saldo calculado sem considerar `account_class`.

Leitura:

Ativo e despesa aumentam com débito.
Passivo, patrimônio e receita aumentam com crédito.

Somar tudo como se débito fosse sempre negativo é erro disfarçado de simplicidade.

Saldo sem classe contábil é número nu.

Número nu engana.

---

### 5.6 Pix sem ledger

Sinal:

Pix em estado `DEBITED`, `SENT`, `SETTLED` ou `REVERSED` sem lançamento contábil correspondente.

Leitura:

O domínio disse que dinheiro andou.
O ledger não viu.

Isso não é detalhe de backend.
É buraco de verdade.

Se o Pix moveu dinheiro, o ledger precisa carregar a cicatriz.

---

### 5.7 Ledger sem Pix

Sinal:

Lançamento com referência de Pix, mas sem Pix correspondente no domínio.

Leitura:

O ledger registrou movimento que o domínio não reconhece.

Pode ser ajuste manual.
Pode ser compensação.
Pode ser bug.
Pode ser coisa pior.

Sem justificativa, é lançamento órfão.

E lançamento órfão não entra calado.

---

### 5.8 Outbox furado

Sinal:

Evento `PIX_SETTLED`, `PIX_REVERSED`, `LEDGER_ENTRY_POSTED` ou equivalente deveria existir, mas não existe em `outbox_events`.

Leitura:

O banco sabe uma coisa.
O mundo externo recebeu outra.

Outbox não é padrão bonito.
É controle de fronteira.

Fato interno sem outbox vira silêncio.
Outbox sem fato interno vira mentira.

---

### 5.9 Evento externo sem prova interna

Sinal:

Gateway recebeu evento, mas não existe ledger/outbox que prove a origem.

Leitura:

O sistema falou sem ter como provar.

Isso é perigoso porque o mundo externo costuma acreditar no evento.

Cliente acredita.
Parceiro acredita.
Suporte acredita.
Auditoria não acredita.

Auditoria volta no ledger.

---

## 6. Ordem correta da auditoria

A ordem mínima é esta:

1. validar escopo do dump;
2. validar versão de schema e commit;
3. recalcular cadeia de hashes por conta;
4. verificar continuidade de sequência;
5. recalcular cada `line_hash`;
6. validar balanço de cada `ledger_entry`;
7. recalcular saldos por `account_class`;
8. cruzar Pix contra ledger;
9. cruzar ledger contra Pix;
10. cruzar outbox contra fatos internos;
11. cruzar eventos externos contra outbox;
12. registrar divergências com hash esperado, hash encontrado, conta, entrada, referência e timestamp.

Não começa pelo PDF.

Começa pelo que não deveria conseguir mentir.

---

## 7. Resultado esperado

Se tudo passar, o auditor pode afirmar:

* a cadeia de hashes não foi rompida;
* os hashes recalculados batem;
* a sequência contábil é contínua;
* as entradas fecham em zero;
* os saldos respeitam a natureza das contas;
* Pix que moveu dinheiro tem lançamento;
* lançamento de Pix tem domínio correspondente;
* evento externo tem origem rastreável;
* outbox não inventou fato;
* o frontend não precisou ser acreditado.

Isso não prova que o produto é bom.
Não prova que o cliente está satisfeito.
Não prova que a operação é barata.

Prova algo mais importante:

o dinheiro contado pelo sistema é reconstruível por fora dele.

---

## 8. Regra final

Auditoria não é confiança.
É reconstrução.

PDF não fecha banco.
Tela não fecha banco.
Promessa não fecha banco.
Log bonito não fecha banco.

Hash fecha integridade.
Partida dobrada fecha valor.
Sequência fecha tempo.
Outbox fecha comunicação.
Snapshot fecha evidência.

Se tudo isso passa, o ledger tem chão.

Se uma dessas coisas quebra, não chama de inconsistência.

Chama pelo nome:

dinheiro sem prova.
