package bank.regenera.risk.aml.domain

data class Disposition(val code:String,val rationale:String,val requiresCoafAssessment:Boolean)
