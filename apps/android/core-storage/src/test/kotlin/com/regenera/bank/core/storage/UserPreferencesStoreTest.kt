package com.regenera.bank.core.storage

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class UserPreferencesStoreTest {

    private lateinit var store: InMemoryUserPreferencesStore

    @Before
    fun setUp() {
        store = InMemoryUserPreferencesStore()
    }

    @Test
    fun onboardingDefaultsToFalse() = runTest {
        assertFalse(store.isOnboardingCompleted())
    }

    @Test
    fun onboardingCanBeMarkedCompleted() = runTest {
        store.setOnboardingCompleted(true)
        assertTrue(store.isOnboardingCompleted())
    }
}