package bank.regenera.ledger.domain.policies

import bank.regenera.ledger.domain.model.JournalEntry

object DoubleEntryPolicy { fun validate(entry: JournalEntry) = entry }
