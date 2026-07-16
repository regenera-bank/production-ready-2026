import Foundation
import Security

public final class KeychainSessionStore: SessionStoreProtocol, @unchecked Sendable {
    private let service = "com.regenera.bank.session"
    private let account = "access"

    public init() {}

    public func load() -> StoredSession? {
        guard let data = readKeychain() else { return nil }
        return try? JSONDecoder().decode(StoredSession.self, from: data)
    }

    public func save(_ session: StoredSession) throws {
        let data = try JSONEncoder().encode(session)
        try writeKeychain(data)
    }

    public func clear() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)
    }

    private func readKeychain() -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else { return nil }
        return data
    }

    private func writeKeychain(_ data: Data) throws {
        try clear()
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        ]
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw NSError(domain: "KeychainSessionStore", code: Int(status))
        }
    }
}