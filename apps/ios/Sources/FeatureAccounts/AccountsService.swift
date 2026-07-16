import CoreNetworking
import Foundation

public enum AccountsService {
    public static func maskedDocument(_ document: String) -> String {
        guard document.count >= 4 else { return "****" }
        return String(repeating: "*", count: document.count - 4) + document.suffix(4)
    }

    public static func accountLabel(from dashboard: DashboardResponse) -> String {
        "Ag \(dashboard.agency) · Cc \(dashboard.maskedAccount)"
    }
}