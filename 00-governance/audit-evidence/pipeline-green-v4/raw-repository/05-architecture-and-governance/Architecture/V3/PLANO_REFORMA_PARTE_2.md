# MISSÃO REGEBANK — AUDITORIA TOTAL, TRIAGEM GO-LIVE E BÍBLIA ARQUITETURAL

> Parte 1 é régua homologada.  
> Parte 2 funciona no Vercel e pipeline verde no GitHub.  
> O problema não é vitrine.  
> O problema é o interior ainda não carregar o mesmo metal.

Este pacote não tenta provar que a Parte 2 liga.  
Ela já liga.

Este pacote mostra o que precisa mudar para a Parte 2 virar sistema nosso: teste, tom, autoria, segurança, contrato e prova.

# PLANO DE REFORMA — PARTE 2 NO NÍVEL DA PARTE 1

## Tese

Não vamos refazer porque está quebrado.
Vamos refazer porque está funcionando sem o nosso nível.

Isso muda tudo.

O deploy verde fica.
A vitrine fica.
O que morre é o interior genérico.

## Ordem cirúrgica

### 1. Backend

- Separar controller, service, repository e policy.
- Rota pública precisa declarar que é pública.
- Rota privada precisa guard.
- Prometeo só backend.
- Gemini só backend.
- Auth mock sai do runtime.
- Teste de rota exposta entra no CI.

### 2. Frontend

- API client único.
- Idempotency-Key gerada na view e preservada no retry.
- React Query para chamadas remotas.
- Matar estado fake de saldo.
- Tela não decide regra financeira.
- `useEffect` com dependência clara.
- Cleanup em listener/timer.

### 3. Mobile

- SecureStore para segredo local.
- AsyncStorage nunca guarda token sensível.
- Biometria vira step-up, não autorização financeira.
- API igual ao web: backend decide.
- Testes mínimos de navegação, Pix e segurança.

### 4. Infra

- Vercel env pública só `VITE_*`.
- Cloud Run segura segredo.
- GitHub Actions executa SAST, teste, build, audit.
- Deploy manual vira exceção documentada, não caminho feliz.

### 5. Docs

- Mover para `5. Docs`.
- Criar índice.
- Cada afirmação precisa de prova.
- Documento sem dono vira lixo.

## Regra final

Não quebra o que está vivo.
Mas não deixa vivo o que mente.
