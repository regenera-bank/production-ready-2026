# Transação em estado desconhecido

**Owner:** payments-operations  
**Substituto:** channel-engineering  
**RTO de contenção:** 5 minutos

## Gatilho

Timeout ou perda de resposta após submissão sem confirmação conclusiva do domínio.

## Declaração

O incidente começa quando o owner registra horário, severidade, escopo e responsável. Sem esse registro existe falha técnica, mas não existe comando de incidente.

## Procedimento

1. bloquear retry;
2. preservar idempotency key;
3. consultar status;
4. acionar reconciliação;
5. comunicar estado pendente;
6. liberar somente após conclusão;

## Gate de decisão

Avançar somente quando o risco imediato estiver contido e a fonte de verdade tiver sido consultada. Abortar qualquer repetição quando o estado permanecer `UNKNOWN`, faltar evidência ou houver divergência financeira.

## Evidência

- horário de declaração e encerramento;
- responsáveis e substituições;
- correlation IDs, fingerprints ou IDs de ação;
- comandos executados e respectivos resultados;
- hashes dos artefatos;
- decisão de avançar ou abortar;
- resultado da reconciliação;
- ações corretivas com owner e prazo.

## Encerramento

Encerrar só com causa, impacto, reconciliação e aceite do owner operacional. Achado sem responsável mantém o incidente aberto.

## Exercício

Testar semestralmente. O resultado precisa registrar tempo observado, falhas do procedimento e correções. Runbook nunca exercitado é hipótese.
