package bank.regenera.transactions.tests

import bank.regenera.transactions.domain.model.*
import java.util.UUID

fun main(){ val t=Transaction(UUID.randomUUID(),"transaction-key-0001",TransactionState.CREATED,emptyList()).transition(TransactionState.VALIDATING,"REQUEST_VALID","system"); check(t.state==TransactionState.VALIDATING) }
