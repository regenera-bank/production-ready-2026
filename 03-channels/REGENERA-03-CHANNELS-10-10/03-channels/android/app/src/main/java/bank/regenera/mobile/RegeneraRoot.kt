package bank.regenera.mobile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import bank.regenera.network.Account
import bank.regenera.network.ApiHttpException
import bank.regenera.network.Balance
import bank.regenera.network.BankingApi
import bank.regenera.network.Money
import bank.regenera.network.PixDestination
import bank.regenera.network.PixRequest
import bank.regenera.network.Transaction
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.launch

@Composable
fun RegeneraRoot(token: String?, onLogin: () -> Unit, onLogout: () -> Unit) {
    if (token == null) {
        LoginScreen(onLogin)
    } else {
        BankingShell(BankingApi(BuildConfig.API_BASE_URL) { token }, onLogout)
    }
}

@Composable
private fun LoginScreen(onLogin: () -> Unit) {
    Scaffold { padding ->
        Column(
            Modifier.padding(padding).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Acesso seguro", style = MaterialTheme.typography.headlineMedium)
            Text("Autenticação no navegador do sistema com Authorization Code + PKCE.")
            Button(onLogin, modifier = Modifier.fillMaxWidth()) {
                Text("Entrar")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BankingShell(api: BankingApi, onLogout: () -> Unit) {
    var accounts by remember { mutableStateOf<List<Account>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        runCatching { api.accounts() }
            .onSuccess { accounts = it }
            .onFailure { error = it.message }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Regenera Bank") },
                actions = { TextButton(onClick = onLogout) { Text("Sair") } }
            )
        }
    ) { padding ->
        Column(
            Modifier.padding(padding).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            accounts.forEach { account -> AccountCard(api, account) }
        }
    }
}

@Composable
private fun AccountCard(api: BankingApi, account: Account) {
    var balance by remember { mutableStateOf<Balance?>(null) }
    var view by rememberSaveable { mutableStateOf("SUMMARY") }

    LaunchedEffect(account.id) {
        balance = runCatching { api.balance(account.id) }.getOrNull()
    }

    Card {
        Column(
            Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(account.displayName)
            Text(
                balance?.available?.let { "R$ " + it.value.replace('.', ',') } ?: "Consultando…",
                style = MaterialTheme.typography.headlineMedium
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { view = "STATEMENT" }) { Text("Extrato") }
                Button(onClick = { view = "PIX" }) { Text("Pix") }
            }

            when (view) {
                "STATEMENT" -> TransactionList(api, account.id) { view = "SUMMARY" }
                "PIX" -> PixForm(api, account.id) { view = "SUMMARY" }
            }
        }
    }
}

@Composable
private fun TransactionList(api: BankingApi, accountId: String, onDone: () -> Unit) {
    var items by remember { mutableStateOf<List<Transaction>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(accountId) {
        runCatching { api.transactions(accountId) }
            .onSuccess { items = it.items }
            .onFailure { error = "Extrato indisponível" }
    }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        items.forEach { transaction ->
            Row(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(transaction.description)
                    Text(transaction.status, style = MaterialTheme.typography.labelSmall)
                }
                Text(
                    (if (transaction.direction == "DEBIT") "- " else "+ ") +
                        "R$ " + transaction.amount.value.replace('.', ',')
                )
            }
        }
        TextButton(onClick = onDone) { Text("Fechar") }
    }
}

@Composable
private fun PixForm(api: BankingApi, accountId: String, onDone: () -> Unit) {
    var key by rememberSaveable { mutableStateOf("") }
    var amount by rememberSaveable { mutableStateOf("") }
    var state by rememberSaveable { mutableStateOf("") }
    var submitted by rememberSaveable { mutableStateOf(false) }
    var idempotencyKey by rememberSaveable { mutableStateOf(UUID.randomUUID().toString()) }
    val scope = rememberCoroutineScope()

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(
            value = key,
            onValueChange = { key = it },
            label = { Text("Chave EVP") },
            enabled = !submitted
        )
        OutlinedTextField(
            value = amount,
            onValueChange = { amount = it },
            label = { Text("Valor 0,00") },
            enabled = !submitted
        )
        Button(
            onClick = {
                submitted = true
                scope.launch {
                    val request = PixRequest(
                        accountId,
                        PixDestination("EVP", key),
                        Money("BRL", amount.replace(',', '.'))
                    )
                    state = try {
                        api.createPix(request, idempotencyKey).status
                    } catch (failure: ApiHttpException) {
                        if (failure.status >= 500) "UNKNOWN" else "REJECTED"
                    } catch (_: IOException) {
                        "UNKNOWN"
                    } catch (_: Exception) {
                        "REJECTED"
                    }
                }
            }
        ) {
            Text(if (submitted) "Consultar novamente" else "Confirmar")
        }
        if (state.isNotEmpty()) Text(state)
        TextButton(onClick = onDone) { Text("Fechar") }
    }
}
