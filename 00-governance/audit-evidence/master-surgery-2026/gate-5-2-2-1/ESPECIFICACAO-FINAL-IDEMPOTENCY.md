# Idempotency Final
1. Escopo por consumidor.
2. Tratamento rigoroso da maquina de estados transacional local.
3. Nao substituira redis lock, porem garantira atomicity.