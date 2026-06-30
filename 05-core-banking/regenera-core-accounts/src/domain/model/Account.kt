package bank.regenera.accounts.domain.model

import java.time.Instant
import java.util.UUID

data class Account(val id: UUID, val productId: UUID, val status: AccountStatus, val openedAt: Instant, val version: Long) {
    init { require(version > 0) }
    fun transitionTo(target: AccountStatus): Account {
        require(AccountTransitionPolicy.canTransition(status, target)) { "invalid account transition: $status -> $target" }
        return copy(status = target, version = Math.addExact(version, 1))
    }
}

object AccountTransitionPolicy {
    private val transitions = mapOf(
        AccountStatus.PENDING_KYC to setOf(AccountStatus.ACTIVE, AccountStatus.BLOCKED, AccountStatus.CLOSED),
        AccountStatus.ACTIVE to setOf(AccountStatus.RESTRICTED, AccountStatus.BLOCKED, AccountStatus.DORMANT, AccountStatus.CLOSING),
        AccountStatus.RESTRICTED to setOf(AccountStatus.ACTIVE, AccountStatus.BLOCKED, AccountStatus.CLOSING),
        AccountStatus.BLOCKED to setOf(AccountStatus.RESTRICTED, AccountStatus.ACTIVE, AccountStatus.CLOSING),
        AccountStatus.DORMANT to setOf(AccountStatus.ACTIVE, AccountStatus.CLOSING),
        AccountStatus.CLOSING to setOf(AccountStatus.CLOSED),
        AccountStatus.CLOSED to emptySet()
    )
    fun canTransition(from: AccountStatus, to: AccountStatus) = to in transitions.getValue(from)
}
