import Foundation

let uuid="123e4567-e89b-42d3-a456-426614174000"
func intent(_ state: CommandState = .ready, _ attest: Bool = true, _ amount: String = "100", _ binding: String = "device-binding-123") -> FinancialIntent {
    FinancialIntent(correlationId: uuid, idempotencyKey: uuid, amountCents: amount, state: state, deviceBindingId: binding, appAttestValid: attest)
}
func fails(_ block: () throws -> Void) -> Bool { do { try block(); return false } catch { return true } }

precondition(fails { _ = try ChannelCore.validate(intent(.unknown)) })
precondition(fails { _ = try ChannelCore.validate(intent(.ready, false)) })
precondition(fails { _ = try ChannelCore.validate(intent(.ready, true, "9223372036854775808")) })
precondition(fails { _ = try ChannelCore.validate(intent(.ready, true, "100", "short")) })
precondition((try? ChannelCore.validate(intent()).amountCents) == "100")
precondition(ChannelCore.canRetry(.failed))
precondition(!ChannelCore.canRetry(.unknown))
precondition(Set(ChannelCore.sanitizeTelemetry(["route":"/pix", "token":"secret"]).keys) == Set(["route"]))
print("ios: 8 testes aprovados")
