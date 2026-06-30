package bank.regenera.observability
import android.util.Log
object AuditLog{fun event(name:String,correlationId:String){Log.i("RegeneraAudit","event=$name correlationId=$correlationId")}}
