import Foundation

// Espelha bff/mobile-bff/src/contracts/mobile-api.ts — centavos sempre String.
public struct SessionResponse: Codable, Equatable, Sendable {
    public let accessToken: String
    public let userId: String
    public let displayName: String
    public let expiresAt: String
    public let kycStatus: String?
    public let accountStatus: String?

    public init(
        accessToken: String,
        userId: String,
        displayName: String,
        expiresAt: String,
        kycStatus: String? = nil,
        accountStatus: String? = nil
    ) {
        self.accessToken = accessToken
        self.userId = userId
        self.displayName = displayName
        self.expiresAt = expiresAt
        self.kycStatus = kycStatus
        self.accountStatus = accountStatus
    }
}

public struct TransactionDTO: Codable, Equatable, Sendable, Identifiable {
    public let id: String
    public let title: String
    public let party: String
    public let date: String
    public let amountCents: String
    public let type: String
    public let channel: String
    public let icon: String
    public let category: String

    public init(
        id: String,
        title: String,
        party: String,
        date: String,
        amountCents: String,
        type: String,
        channel: String,
        icon: String,
        category: String
    ) {
        self.id = id
        self.title = title
        self.party = party
        self.date = date
        self.amountCents = amountCents
        self.type = type
        self.channel = channel
        self.icon = icon
        self.category = category
    }
}

public struct DashboardResponse: Codable, Equatable, Sendable {
    public let accountId: String
    public let maskedAccount: String
    public let agency: String
    public let document: String
    public let balanceCents: String
    public let availableCents: String
    public let currency: String
    public let correlationId: String
    public let recentTransactions: [TransactionDTO]

    public init(
        accountId: String,
        maskedAccount: String,
        agency: String,
        document: String,
        balanceCents: String,
        availableCents: String,
        currency: String,
        correlationId: String,
        recentTransactions: [TransactionDTO]
    ) {
        self.accountId = accountId
        self.maskedAccount = maskedAccount
        self.agency = agency
        self.document = document
        self.balanceCents = balanceCents
        self.availableCents = availableCents
        self.currency = currency
        self.correlationId = correlationId
        self.recentTransactions = recentTransactions
    }
}

public struct PixKeyDTO: Codable, Equatable, Sendable, Identifiable {
    public let id: String
    public let type: String
    public let key: String
    public let createdAt: String

    public init(id: String, type: String, key: String, createdAt: String) {
        self.id = id
        self.type = type
        self.key = key
        self.createdAt = createdAt
    }
}

public struct PixTransferResponse: Codable, Equatable, Sendable {
    public let endToEndId: String
    public let paymentId: String
    public let receiverMasked: String
    public let amountCents: String
    public let balanceCents: String
    public let availableCents: String

    public init(
        endToEndId: String,
        paymentId: String,
        receiverMasked: String,
        amountCents: String,
        balanceCents: String,
        availableCents: String
    ) {
        self.endToEndId = endToEndId
        self.paymentId = paymentId
        self.receiverMasked = receiverMasked
        self.amountCents = amountCents
        self.balanceCents = balanceCents
        self.availableCents = availableCents
    }
}

public struct TransferResponse: Codable, Equatable, Sendable {
    public let paymentId: String
    public let creditorName: String
    public let amountCents: String
    public let balanceCents: String
    public let availableCents: String

    public init(
        paymentId: String,
        creditorName: String,
        amountCents: String,
        balanceCents: String,
        availableCents: String
    ) {
        self.paymentId = paymentId
        self.creditorName = creditorName
        self.amountCents = amountCents
        self.balanceCents = balanceCents
        self.availableCents = availableCents
    }
}

public struct HealthLiveResponse: Codable, Equatable, Sendable {
    public let status: String
    public let service: String

    public init(status: String, service: String) {
        self.status = status
        self.service = service
    }
}

public enum MobileBFFPath {
    public static let healthLive = "/health/live"
    public static let session = "/v1/auth/session"
    public static let home = "/v1/home"
    public static let dashboard = "/v1/banking/dashboard"
    public static let transactions = "/v1/banking/transactions"
    public static let pixKeys = "/v1/banking/pix/keys"
    public static let pixLookup = "/v1/banking/pix/lookup"
    public static let pixTransfers = "/v1/banking/pix/transfers"
    public static let transfers = "/v1/banking/transfers"
    public static let cards = "/v1/banking/cards"
    public static let credit = "/v1/banking/credit"
    public static let investments = "/v1/banking/investments"
    public static let profile = "/v1/profile"
    public static let support = "/v1/support/tickets"
}