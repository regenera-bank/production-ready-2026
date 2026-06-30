package bank.regenera.transactions.domain.policies

import bank.regenera.transactions.domain.model.TransactionState
import bank.regenera.transactions.domain.model.TransitionPolicy

object TransactionTransitionPolicy { fun requireAllowed(from: TransactionState,to: TransactionState){ require(TransitionPolicy.canTransition(from,to)) } }
