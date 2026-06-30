package bank.regenera.risk.aml.domain

import java.util.UUID

data class Investigation(val id:UUID,val alertId:UUID,val owner:String,val status:String)
