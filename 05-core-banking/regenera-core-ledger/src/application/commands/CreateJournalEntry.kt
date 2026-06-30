package bank.regenera.ledger.application.commands

import bank.regenera.ledger.domain.model.JournalEntry

data class CreateJournalEntry(val entry: JournalEntry)
