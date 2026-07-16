package com.regenera.bank.core.observability

import com.regenera.bank.core.network.HealthResponse
import com.regenera.bank.core.network.MobileBffApi
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BffHealthProbeTest {

    @Test
    fun returnsHealthyWhenBffRespondsOk() = runTest {
        val api = mockk<MobileBffApi>()
        val logger = mockk<RegeneraLogger>(relaxed = true)
        coEvery { api.health() } returns HealthResponse("ok", "mobile-bff", "android")

        val probe = BffHealthProbe(api, logger)
        val status = probe.probe()

        assertTrue(status.healthy)
        assertEquals("mobile-bff", status.layer)
        verify { logger.info(any(), any()) }
    }

    @Test
    fun returnsUnhealthyOnNetworkFailure() = runTest {
        val api = mockk<MobileBffApi>()
        val logger = mockk<RegeneraLogger>(relaxed = true)
        coEvery { api.health() } throws RuntimeException("connection refused")

        val probe = BffHealthProbe(api, logger)
        val status = probe.probe()

        assertFalse(status.healthy)
        assertEquals("unreachable", status.layer)
        verify { logger.error(any(), any(), any()) }
    }
}