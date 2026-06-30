package bank.regenera.transactions.domain.policies

object RetryPolicy { fun automaticRetryAllowed(financialCommand: Boolean)=!financialCommand }
