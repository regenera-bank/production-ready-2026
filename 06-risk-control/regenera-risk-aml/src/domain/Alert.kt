package bank.regenera.risk.aml.domain

import java.time.Instant
import java.util.UUID

data class Alert(val id:UUID,val customerId:UUID,val scenarioId:String,val createdAt:Instant,val severity:String)
