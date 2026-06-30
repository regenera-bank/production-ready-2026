package bank.regenera.mobile
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.mutableStateOf
import bank.regenera.design.RegeneraTheme
import bank.regenera.security.SessionVault
class MainActivity:ComponentActivity(){private lateinit var oidc:OidcClient;private lateinit var vault:SessionVault;private val sessionState=mutableStateOf<String?>(null);private val result=registerForActivityResult(ActivityResultContracts.StartActivityForResult()){r->if(r.data!=null)oidc.exchange(r.data!!){it.onSuccess{token->vault.write(token);sessionState.value=token}}};override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);window.setFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE,android.view.WindowManager.LayoutParams.FLAG_SECURE);vault=SessionVault(this);sessionState.value=vault.read();oidc=OidcClient(this);setContent{RegeneraTheme{RegeneraRoot(sessionState.value,onLogin={result.launch(oidc.authorizationIntent())},onLogout={vault.clear();sessionState.value=null})}}}override fun onDestroy(){oidc.close();super.onDestroy()}}
