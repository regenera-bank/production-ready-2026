package bank.regenera.ledger.application.commands

import java.util.UUID
import bank.regenera.ledger.domain.model.JournalEntry

data class ReverseEntry(val originalEntryId: UUID, val reversal: JournalEntry)
