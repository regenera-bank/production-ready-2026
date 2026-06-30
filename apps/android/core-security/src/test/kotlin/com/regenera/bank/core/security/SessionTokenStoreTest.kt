package com.regenera.bank.core.security

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class SessionTokenStoreTest {

    private lateinit var store: InMemorySessionTokenStore

    @Before
    fun setUp() {
        store = InMemorySessionTokenStore()
    }

    @Test
    fun saveAndRetrieveSessionToken() = runTest {
        store.saveSessionToken("sess-mobile-001")
        assertEquals("sess-mobile-001", store.getSessionToken())
    }

    @Test
    fun clearRemovesSessionToken() = runTest {
        store.saveSessionToken("sess-mobile-001")
        store.clearSessionToken()
        assertNull(store.getSessionToken())
    }
}