# Incidente de canal

**Owner:** incident-command  
**Substituto:** operations-governance  
**RTO de contenção:** 15 minutos

## Gatilho

SEV-1: duplicidade, sessão comprometida, exposição de segredo ou ação privilegiada sem trilha.
SEV-2: indisponibilidade ampla, autenticação degradada ou quebra de contrato sem efeito financeiro confirmado.

## Declaração

O incidente começa quando o owner registra horário, severidade, escopo e responsável. Sem esse registro existe falha técnica, mas não existe comando de incidente.

## Procedimento

1. congelar promoção;
2. preservar correlation IDs;
3. revogar sessão ou credencial;
4. consultar estado no domínio;
5. reconciliar antes de repetir;
6. registrar linha do tempo;

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
