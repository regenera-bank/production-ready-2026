package com.regenera.bank.di

import com.regenera.bank.core.network.MobileBffApi
import com.regenera.bank.core.network.MobileBffClientFactory
import com.regenera.bank.core.network.MobileBffConfig
import com.regenera.bank.core.security.SessionTokenStore
import com.regenera.bank.security.PreferencesSessionTokenStore
import com.regenera.bank.feature.auth.AuthBffClient
import com.regenera.bank.feature.home.HomeBffClient
import com.regenera.bank.feature.pix.PixBffClient
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideSessionTokenStore(store: PreferencesSessionTokenStore): SessionTokenStore = store

    @Provides
    @Singleton
    fun provideMobileBffConfig(): MobileBffConfig = MobileBffConfig.emulatorDefault()

    @Provides
    @Singleton
    fun provideMobileBffClientFactory(
        config: MobileBffConfig,
        sessionTokenStore: SessionTokenStore,
    ): MobileBffClientFactory = MobileBffClientFactory(config) {
        // Blocking read avoided in production via cached session; sufficient for bootstrap.
        kotlinx.coroutines.runBlocking { sessionTokenStore.getSessionToken() }
    }

    @Provides
    @Singleton
    fun provideMobileBffApi(factory: MobileBffClientFactory): MobileBffApi =
        factory.createApi()

    @Provides
    @Singleton
    fun provideAuthBffClient(factory: MobileBffClientFactory): AuthBffClient =
        factory.create(AuthBffClient::class.java)

    @Provides
    @Singleton
    fun provideHomeBffClient(factory: MobileBffClientFactory): HomeBffClient =
        factory.create(HomeBffClient::class.java)

    @Provides
    @Singleton
    fun providePixBffClient(factory: MobileBffClientFactory): PixBffClient =
        factory.create(PixBffClient::class.java)
}