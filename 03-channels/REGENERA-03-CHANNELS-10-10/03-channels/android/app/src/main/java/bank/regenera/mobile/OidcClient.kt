package bank.regenera.mobile
import android.content.Context
import android.content.Intent
import android.net.Uri
import net.openid.appauth.*
class OidcClient(context:Context){
  private val service=AuthorizationService(context)
  private val config=AuthorizationServiceConfiguration(Uri.parse(BuildConfig.OIDC_AUTHORIZATION_ENDPOINT),Uri.parse(BuildConfig.OIDC_TOKEN_ENDPOINT))
  fun authorizationIntent():Intent{require(BuildConfig.OIDC_CLIENT_ID.isNotBlank());val request=AuthorizationRequest.Builder(config,BuildConfig.OIDC_CLIENT_ID,ResponseTypeValues.CODE,Uri.parse(BuildConfig.OIDC_REDIRECT_URI)).setScope("openid profile accounts payments").setCodeVerifier(CodeVerifierUtil.generateRandomCodeVerifier()).build();return service.getAuthorizationRequestIntent(request)}
  fun exchange(intent:Intent,onResult:(Result<String>)->Unit){val response=AuthorizationResponse.fromIntent(intent);val error=AuthorizationException.fromIntent(intent);if(response==null){onResult(Result.failure(error?:IllegalStateException("OIDC_RESPONSE_MISSING")));return};service.performTokenRequest(response.createTokenExchangeRequest()){token,exception->val access=token?.accessToken;if(access==null)onResult(Result.failure(exception?:IllegalStateException("OIDC_TOKEN_MISSING")))else onResult(Result.success(access))}}
  fun close()=service.dispose()
}
