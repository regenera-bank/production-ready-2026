package bank.regenera.design
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
private val Palette=darkColorScheme(primary=Color(0xFF22D3EE),secondary=Color(0xFF60A5FA),background=Color(0xFF020617),surface=Color(0xFF071225),onBackground=Color(0xFFF8FAFC),onSurface=Color(0xFFF8FAFC))
@Composable fun RegeneraTheme(content:@Composable()->Unit)=MaterialTheme(colorScheme=Palette,content=content)
