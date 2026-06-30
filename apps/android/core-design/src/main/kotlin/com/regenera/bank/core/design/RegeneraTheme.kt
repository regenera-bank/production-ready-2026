package com.regenera.bank.core.design

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val RegeneraColorScheme = darkColorScheme(
    primary = RegeneraTokens.Primary,
    onPrimary = RegeneraTokens.OnPrimary,
    background = RegeneraTokens.BackgroundDeep,
    onBackground = RegeneraTokens.OnBackground,
    surface = RegeneraTokens.Surface,
    onSurface = RegeneraTokens.OnBackground,
    error = RegeneraTokens.Error,
    tertiary = RegeneraTokens.Navy,
)

@Composable
fun RegeneraTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = RegeneraColorScheme,
        content = content,
    )
}

fun Color.toHex(): String {
    val argb = (alpha * 255).toInt().shl(24) or
        (red * 255).toInt().shl(16) or
        (green * 255).toInt().shl(8) or
        (blue * 255).toInt()
    return "#%08X".format(argb)
}