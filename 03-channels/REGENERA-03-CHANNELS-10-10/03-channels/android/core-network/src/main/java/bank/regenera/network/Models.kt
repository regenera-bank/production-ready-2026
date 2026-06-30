package bank.regenera.network
import kotlinx.serialization.Serializable
@Serializable data class Money(val currency:String,val value:String)
@Serializable data class Account(val id:String,val displayName:String,val type:String,val currency:String,val status:String)
@Serializable data class Balance(val accountId:String,val book:Money,val available:Money,val blocked:Money,val asOf:String)
@Serializable data class Transaction(val id:String,val accountId:String,val type:String,val direction:String,val amount:Money,val status:String,val occurredAt:String,val description:String,val counterpartyName:String?=null)
@Serializable data class TransactionPage(val items:List<Transaction>,val nextCursor:String?=null)
@Serializable data class PixDestination(val keyType:String,val key:String)
@Serializable data class PixRequest(val sourceAccountId:String,val destination:PixDestination,val amount:Money,val description:String?=null)
@Serializable data class PixPayment(val id:String,val status:String,val amount:Money,val createdAt:String,val settledAt:String?=null,val failureCode:String?=null)
