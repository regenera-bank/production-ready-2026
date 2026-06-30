package bank.regenera.transactions.tests

import bank.regenera.transactions.domain.model.*
import java.util.UUID

fun main(){ var t=Transaction(UUID.randomUUID(),"transaction-key-0002",TransactionState.SENT,emptyList()); t=t.transition(TransactionState.UNKNOWN,"PROVIDER_TIMEOUT","spi-adapter"); check(t.state==TransactionState.UNKNOWN); t=t.transition(TransactionState.SETTLED,"RECONCILIATION_MATCH","reconciliation"); check(t.state==TransactionState.SETTLED) }
