package bank.regenera.security
import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import android.util.Base64
class SessionVault(private val context:Context){
  private val alias="regenera.session.aes"; private val prefs=context.getSharedPreferences("secure_session",Context.MODE_PRIVATE)
  private fun key():SecretKey{val ks=KeyStore.getInstance("AndroidKeyStore").apply{load(null)};val existing=ks.getKey(alias,null) as? SecretKey;if(existing!=null)return existing;val gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");gen.init(KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setUserAuthenticationRequired(false).build());return gen.generateKey()}
  fun write(token:String){val c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key());prefs.edit().putString("iv",Base64.encodeToString(c.iv,Base64.NO_WRAP)).putString("value",Base64.encodeToString(c.doFinal(token.toByteArray()),Base64.NO_WRAP)).apply()}
  fun read():String?{val iv=prefs.getString("iv",null)?:return null;val value=prefs.getString("value",null)?:return null;return runCatching{val c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(),GCMParameterSpec(128,Base64.decode(iv,Base64.NO_WRAP)));String(c.doFinal(Base64.decode(value,Base64.NO_WRAP)))}.getOrNull()}
  fun clear()=prefs.edit().clear().apply()
}
