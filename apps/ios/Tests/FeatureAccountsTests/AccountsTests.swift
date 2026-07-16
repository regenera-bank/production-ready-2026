import CoreNetworking
import XCTest
@testable import FeatureAccounts

final class AccountsTests: XCTestCase {
    func testMaskedDocument() {
        XCTAssertEqual(AccountsService.maskedDocument("12345678901"), "*******8901")
    }

    func testAccountLabel() {
        let dashboard = DashboardResponse(
            accountId: "a",
            maskedAccount: "****1",
            agency: "0001",
            document: "1",
            balanceCents: "0",
            availableCents: "0",
            currency: "BRL",
            correlationId: "c",
            recentTransactions: []
        )
        XCTAssertEqual(AccountsService.accountLabel(from: dashboard), "Ag 0001 · Cc ****1")
    }
}