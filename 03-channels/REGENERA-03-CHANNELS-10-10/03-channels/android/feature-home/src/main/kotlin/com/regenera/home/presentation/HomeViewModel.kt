package com.regenera.home.presentation

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class HomeViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<Any>(Any())
    val uiState: StateFlow<Any> = _uiState.asStateFlow()
}
