import SwiftUI

// Tokens alinhados a design-system/tokens/color.json e AGENTS.md.
// Canal não redefine paleta — importa daqui.
public extension Color {
    enum Regenera {
        public static let primary = Color(hex: 0x22D3EE)
        public static let primaryStrong = Color(hex: 0x0891B2)
        public static let backgroundDeep = Color(hex: 0x020617)
        public static let backgroundSurface = Color(hex: 0x0F172A)
        public static let gradientStart = Color(hex: 0x1E3A8A)

        public static let textPrimary = Color(hex: 0xF8FAFC)
        public static let textSecondary = Color(hex: 0x94A3B8)

        public static let success = Color(hex: 0x22C55E)
        public static let warning = Color(hex: 0xF59E0B)
        public static let danger = Color(hex: 0xEF4444)
        public static let unknown = Color(hex: 0xD946EF)

        public static let border = Color(hex: 0x1E293B)
        public static let glassOverlay = Color.white.opacity(0.08)
    }

    init(hex: UInt32, opacity: Double = 1.0) {
        let red = Double((hex >> 16) & 0xFF) / 255.0
        let green = Double((hex >> 8) & 0xFF) / 255.0
        let blue = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: red, green: green, blue: blue, opacity: opacity)
    }
}

public enum RegeneraTypography {
    public static let fontFamily = "Manrope"
}