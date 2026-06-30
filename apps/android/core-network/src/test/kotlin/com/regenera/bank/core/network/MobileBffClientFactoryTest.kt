package com.regenera.bank.core.network

import io.mockk.every
import io.mockk.mockk
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class MobileBffClientFactoryTest {

    private lateinit var server: MockWebServer

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun healthEndpointDeserializesMobileBffResponse() {
        server.enqueue(
            MockResponse()
                .setBody("""{"status":"ok","layer":"mobile-bff","channel":"android"}""")
                .addHeader("Content-Type", "application/json"),
        )

        val config = MobileBffConfig(baseUrl = server.url("/v1/").toString())
        val factory = MobileBffClientFactory(config)
        val api = factory.createApi()

        val response = api.health()

        assertEquals("ok", response.status)
        assertEquals("mobile-bff", response.layer)
        assertEquals("android", response.channel)
    }

    @Test
    fun sessionCookieIsAttachedWhenProviderReturnsValue() {
        server.enqueue(
            MockResponse()
                .setBody("""{"status":"ok","layer":"mobile-bff"}""")
                .addHeader("Content-Type", "application/json"),
        )

        val sessionProvider = mockk<() -> String?>()
        every { sessionProvider.invoke() } returns "sess-abc123"

        val config = MobileBffConfig(baseUrl = server.url("/v1/").toString())
        val factory = MobileBffClientFactory(config, sessionProvider)
        factory.createApi().health()

        val request = server.takeRequest()
        assertEquals("regenera_session=sess-abc123", request.getHeader("Cookie"))
    }
}