# Regenera Bank — Canais

**Documento:** CH-BASELINE-001  
**Estado:** candidato técnico; assinatura e homologações externas pendentes  
**Responsável técnico declarado:** Don Paulo Ricardo

Canal não movimenta dinheiro. Canal cria intenção, apresenta estado e carrega prova de contexto.
Quem decide é o domínio. Quem registra é o ledger. Quem confirma é a reconciliação.

## Escopo entregue

- Web Banking: núcleo de intenção, sessão e telemetria sanitizada;
- Android: núcleo compilável de intenção, device binding e attestation declarada;
- iOS: núcleo compilável de intenção, device binding e App Attest declarado;
- Windows Operations: maker-checker, mascaramento e trilha SHA-256 verificável;
- Partner Portal: mTLS por fingerprint, escopo e webhook HMAC com bloqueio de replay.

## Limite desta baseline

Isto não é binário de loja, portal publicado nem homologação de fornecedor.
Integrações de Keystore, Keychain, App Attest, Play Integrity, WAF, CSP, rate limit e identidade corporativa continuam marcadas como pendentes onde não há prova física.

A matriz de controles distingue o que foi testado do que ainda depende de plataforma.
Não existe controle “implementado” só porque está escrito.

## Gates

```bash
make all
```

A execução exige Python 3.11+, Node.js 22+, TypeScript, JDK/Kotlin e Swift.
Falha de compilação interrompe a release. Evidência antiga não autoriza build novo.

## Release

O diretório `dist/` guarda evidência local. O hash externo cobre o ZIP entregue.
A assinatura destacada depende da chave privada real do responsável.
Nenhuma aprovação externa foi simulada.
