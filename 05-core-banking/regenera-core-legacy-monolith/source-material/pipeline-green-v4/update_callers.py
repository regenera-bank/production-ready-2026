import re

with open('src/core/pix.service.ts', 'r') as f:
    c = f.read()
c = c.replace('this.ledgerService.credit(receiverAccount.id, data.amountCents / 100, {', 'this.ledgerService.credit(receiverAccount.id, data.amountCents, {')
# executePix receives amount in Reais, calls executePixAtomic with amountCents
c = c.replace('const result = await this.ledgerService.executePixAtomic(senderNeuralId, receiverKey, amount, {', 'const result = await this.ledgerService.executePixAtomic(senderNeuralId, receiverKey, Math.round(amount * 100), {')
# and response uses amount * 100
with open('src/core/pix.service.ts', 'w') as f:
    f.write(c)

with open('src/investments/investments.service.ts', 'r') as f:
    c = f.read()
c = c.replace('await this.coreService.debit(neuralId, totalVolumeCents / 100, {', 'await this.coreService.debit(neuralId, totalVolumeCents, {')
c = c.replace('await this.coreService.credit(neuralId, totalVolumeCents / 100, {', 'await this.coreService.credit(neuralId, totalVolumeCents, {')
with open('src/investments/investments.service.ts', 'w') as f:
    f.write(c)

with open('src/lifestyle/lifestyle.service.ts', 'r') as f:
    c = f.read()
c = c.replace('await this.coreService.debit(neuralId, amountCents / 100, {', 'await this.coreService.debit(neuralId, amountCents, {')
with open('src/lifestyle/lifestyle.service.ts', 'w') as f:
    f.write(c)

with open('src/core/core.controller.ts', 'r') as f:
    c = f.read()
c = c.replace('this.coreService.transfer(req.user.sub, body.receiverId, body.amount);', 'this.coreService.transfer(req.user.sub, body.receiverId, Math.round(body.amount * 100));')
with open('src/core/core.controller.ts', 'w') as f:
    f.write(c)
