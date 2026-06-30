package com.regenera.onboarding.presentation

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class OnboardingViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<Any>(Any())
    val uiState: StateFlow<Any> = _uiState.asStateFlow()
}
