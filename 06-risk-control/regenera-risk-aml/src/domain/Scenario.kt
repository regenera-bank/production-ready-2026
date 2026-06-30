package bank.regenera.risk.aml.domain

data class Scenario(val id:String,val version:Int,val enabled:Boolean,val thresholdMinorUnits:Long)
