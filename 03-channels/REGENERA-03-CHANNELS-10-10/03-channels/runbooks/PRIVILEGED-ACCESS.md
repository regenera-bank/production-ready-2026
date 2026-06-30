# Uso indevido de acesso privilegiado

**Owner:** operations-incident-command  
**Substituto:** security-operations  
**RTO de contenção:** 10 minutos

## Gatilho

Ação crítica sem dupla aprovação, sessão fora do prazo ou acesso incompatível com função.

## Declaração

O incidente começa quando o owner registra horário, severidade, escopo e responsável. Sem esse registro existe falha técnica, mas não existe comando de incidente.

## Procedimento

1. suspender sessão;
2. preservar trilha;
3. bloquear ação pendente;
4. confirmar maker e checker;
5. revisar PII acessada;
6. abrir investigação;

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
