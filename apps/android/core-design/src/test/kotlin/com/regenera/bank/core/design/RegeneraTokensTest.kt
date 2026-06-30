package com.regenera.bank.core.design

import org.junit.Assert.assertEquals
import org.junit.Test

class RegeneraTokensTest {

    @Test
    fun primaryTokenMatchesDesignSystem() {
        assertEquals("#FF22D3EE", RegeneraTokens.Primary.toHex())
    }

    @Test
    fun backgroundDeepTokenMatchesDesignSystem() {
        assertEquals("#FF020617", RegeneraTokens.BackgroundDeep.toHex())
    }
}