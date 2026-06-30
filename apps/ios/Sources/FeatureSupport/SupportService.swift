import Foundation

public struct SupportTicket: Identifiable, Equatable, Sendable {
    public let id: String
    public let subject: String
    public let status: String
}

public enum SupportService {
    public static func openTickets() -> [SupportTicket] {
        [SupportTicket(id: "t-1", subject: "Dúvida sobre Pix", status: "OPEN")]
    }
}