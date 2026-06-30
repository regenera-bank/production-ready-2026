package bank.regenera.ledger.application.commands

import bank.regenera.ledger.domain.model.Settlement

data class SettleEntry(val settlement: Settlement)
