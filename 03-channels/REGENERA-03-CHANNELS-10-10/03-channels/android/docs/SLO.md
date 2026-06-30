# SLO

## Fronteira

O componente `regenera-channel-android` não atravessa a fronteira de outro domínio por acesso direto a banco. Toda chamada é autenticada, autorizada, observável e versionada.

## Riscos

- duplicidade;
- replay;
- timeout ambíguo;
- vazamento de dado;
- dependência externa indisponível.

## Controle

Idempotência, correlação, trilha, timeout explícito, reconciliação e rollback controlado.
