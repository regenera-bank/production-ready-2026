# AUDITORIA INDEPENDENTE — RASTREABILIDADE MATEMÁTICA DO LEDGER

Neste banco, auditoria não começa em PDF.

PDF é relato.
Ledger é evidência.

Relatório pode estar bonito.
Dashboard pode estar verde.
Frontend pode jurar que está tudo certo.

Nada disso fecha dinheiro.

Auditoria independente recalcula o ledger.

Linha por linha.
Conta por conta.
Hash por hash.
Débito contra crédito.
Evento contra lançamento.
Estado contra trilha.

A matemática não pede confiança.
Ela cobra coerência.

---

## 1. O que o auditor recebe

O auditor deve receber um dump readonly do ledger.

No mínimo:

* `ledger_entries`
* `ledger_lines`
* `ledger_accounts`
* `outbox_events`
* tabelas de Pix que apontam para lançamentos contábeis
* hashes de referência, quando existirem
* janela de tempo auditada
* identificador do snapshot
* horário de extração
* responsável técnico pela extração

Dump sem janela definida vira conversa.
Dump sem snapshot vira fotografia tremida.
Dump sem readonly vira evidência encostada na mão de quem pode alterar.

Auditoria boa não pergunta se o sistema está certo.
Ela reconstrói o que aconteceu e vê se a história fecha.

---

## 2. Garantia criptográfica do ledger

As linhas do ledger são encadeadas por hash.

Cada linha carrega:

* o hash anterior
* os dados da própria linha
* o hash calculado da linha atual

A conta vira uma linha do tempo.

Se alguém muda uma linha antiga, a cadeia quebra.
Se alguém apaga uma linha, a sequência quebra.
Se alguém insere uma linha fora de ordem, a continuidade quebra.

O auditor não acredita no banco.
O auditor recalcula.

O algoritmo é simples:

1. ordenar as linhas por conta e sequência;
2. pegar o `previous_hash` da linha atual;
3. comparar com o `line_hash` da linha anterior;
4. recalcular o hash da linha atual com os mesmos campos usados pelo banco;
5. comparar o resultado recalculado com o `line_hash` armazenado.

Se não bater, não é divergência cosmética.
É violação de trilha.

---

## 3. O que o auditor deve procurar

### 3.1 Quebra de hash

Sinal:

`previous_hash` da linha N não bate com `line_hash` da linha N-1.

Leitura:

A cadeia foi rompida.

Pode ser bug.
Pode ser migração mal feita.
Pode ser DBA mexendo onde não devia.
Pode ser tentativa de reescrever passado.

Para auditoria, a diferença importa pouco no começo.

Primeiro marca como violação.
Depois investiga causa.

Ledger append-only não aceita “corrigi no banco”.
Correção financeira nasce como novo lançamento.
Nunca como edição do antigo.

---

### 3.2 Hash recalculado diferente do hash armazenado

Sinal:

A cadeia parece apontar certo, mas o hash recalculado da linha não bate.

Leitura:

Alguém alterou conteúdo sem preservar a prova.

Valor.
Conta.
Direção.
Moeda.
Entrada.
Sequência.

Qualquer campo usado no hash que muda depois quebra a verdade matemática.

Se o hash não fecha, o dado não é confiável.

---

### 3.3 Furo de sequência

Sinal:

A conta tem sequência quebrada, duplicada ou fora de ordem.

Leitura:

A linha do tempo foi ferida.

Sequência não é decoração.
É ordem de acontecimento.

Dinheiro sem ordem vira narrativa.
Narrativa não fecha caixa.

---

### 3.4 Saldo fantasma

Sinal:

Uma `ledger_entry` não fecha em zero.

Débitos e créditos da mesma entrada não se anulam.

Leitura:

O sistema criou dinheiro do nada ou jogou dinheiro no ralo.

Partidas dobradas não são sugestão.
São a cerca elétrica do ledger.

Se uma transação Pix gerou lançamento desbalanceado, não existe “quase certo”.
Existe erro contábil.

---

### 3.5 Conta com saldo incompatível com sua natureza

Sinal:

Saldo calculado ignora a classe da conta.

Ativo e despesa crescem no débito.
Passivo, patrimônio e receita crescem no crédito.

Leitura:

Somar débito como negativo sempre é erro.
Somar crédito como positivo sempre é erro.

Saldo sem classe contábil é número sem contexto.

Número sem contexto é isca.

---

### 3.6 Pix sem lançamento

Sinal:

Pix marcado como `DEBITED`, `SENT`, `SETTLED` ou `REVERSED` sem `ledger_entry_id` ou sem `reversal_ledger_entry_id` quando aplicável.

Leitura:

O domínio disse que dinheiro andou.
O ledger não viu.

Isso não é detalhe de integração.
É ruptura entre negócio e contabilidade.

Se o Pix andou, o ledger precisa carregar a cicatriz.

---

### 3.7 Lançamento sem Pix correspondente

Sinal:

`ledger_entries.reference_type = 'PIX_PAYMENT'` ou equivalente, mas o domínio Pix não aponta para esse lançamento.

Leitura:

O ledger registrou movimento que o domínio não reconhece.

Pode ser ajuste manual.
Pode ser bug.
Pode ser lançamento órfão.

Lançamento órfão precisa de justificativa.
Sem justificativa, vira suspeita.

---

### 3.8 Furo no outbox

Sinal:

Um Pix liquidou, reverteu ou falhou com compensação, mas não existe evento correspondente em `outbox_events`.

Leitura:

O banco sabe de uma coisa.
O mundo externo recebeu outra.

Outbox não é enfeite de arquitetura.
É fronteira entre fato interno e comunicação externa.

Se o ledger moveu dinheiro e o evento não nasceu, o sistema ficou mudo.
Se o evento saiu sem ledger, o sistema mentiu.

Os dois casos são graves.

---

### 3.9 Outbox entregue sem origem contábil

Sinal:

Evento externo de liquidação, reversão ou compensação existe, mas não aponta para lançamento válido.

Leitura:

O sistema anunciou fato que não consegue provar.

Evento sem ledger é boato com JSON.

---

## 4. Ordem correta da auditoria

A auditoria deve seguir esta ordem:

1. Validar snapshot e escopo.
2. Recalcular cadeia de hashes por conta.
3. Verificar continuidade de sequência.
4. Recalcular saldo por classe contábil.
5. Validar balanço de cada `ledger_entry`.
6. Cruzar Pix contra ledger.
7. Cruzar ledger contra outbox.
8. Cruzar outbox contra eventos externos, se houver.
9. Emitir divergências com linha, conta, entrada, referência e hash esperado.

Não começa pelo dashboard.
Não começa pelo relatório mensal.
Não começa pela opinião do time.

Começa pelo ledger.

---

## 5. Resultado esperado

Se tudo passar, o auditor pode afirmar:

* a cadeia não foi rompida;
* as linhas recalculadas batem com os hashes armazenados;
* as entradas contábeis fecham em zero;
* os saldos respeitam a classe das contas;
* os Pix relevantes possuem lançamento contábil;
* os eventos externos possuem origem rastreável;
* não há comunicação sem fato contábil;
* não há fato contábil sem trilha de comunicação quando ela era obrigatória.

Isso não prova que o negócio é bom.
Não prova que o cliente está feliz.
Não prova que o produto presta.

Prova uma coisa mais importante:

o dinheiro contado pelo banco é o mesmo dinheiro reconstruído pela auditoria.

---

## 6. Regra final

Frontend não fecha banco.
PDF não fecha banco.
Promessa não fecha banco.

Hash fecha integridade.
Partida dobrada fecha valor.
Outbox fecha comunicação.
Snapshot fecha evidência.

Se essas quatro coisas passam, a auditoria tem chão.

Se uma delas quebra, não chama de “inconsistência”.

Chama pelo nome:

dinheiro sem prova.
