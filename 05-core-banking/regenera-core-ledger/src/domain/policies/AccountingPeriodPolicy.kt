package bank.regenera.ledger.domain.policies

import bank.regenera.ledger.domain.model.AccountingPeriodStatus

object AccountingPeriodPolicy { fun requireOpen(status: AccountingPeriodStatus) { require(status == AccountingPeriodStatus.OPEN) } }
