import RegeneraDesign
import CoreDesign
import SwiftUI

public struct SupportView: View {
    private let tickets: [SupportTicket]

    public init(tickets: [SupportTicket] = SupportService.openTickets()) {
        self.tickets = tickets
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading, spacing: 12) {
                Text("Suporte")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                ForEach(tickets) { ticket in
                    RegeneraCard {
                        Text(ticket.subject)
                        Text(ticket.status)
                            .foregroundStyle(Color.Regenera.warning)
                    }
                }
            }
            .padding()
        }
    }
}