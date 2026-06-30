package bank.regenera.security
import android.content.Context
import com.google.android.play.core.integrity.*
import kotlinx.coroutines.tasks.await
class PlayIntegrityGateway(context:Context,private val cloudProjectNumber:Long){
  private val manager=StandardIntegrityManagerFactory.create(context)
  private var provider:StandardIntegrityManager.StandardIntegrityTokenProvider?=null
  suspend fun prepare(){require(cloudProjectNumber>0){"Play Integrity não configurado"};provider=manager.prepareIntegrityToken(StandardIntegrityManager.PrepareIntegrityTokenRequest.builder().setCloudProjectNumber(cloudProjectNumber).build()).await()}
  suspend fun token(requestHash:String):String{val p=provider?:throw IllegalStateException("attestation não preparada");return p.request(StandardIntegrityManager.StandardIntegrityTokenRequest.builder().setRequestHash(requestHash).build()).await().token()}
}
