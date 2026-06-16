import SwiftUI
import FamilyControls

@main
struct ChessQuestShieldApp: App {
    @State private var isAuthorized = false

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .task {
                    await checkAuthorization()
                }
        }
    }

    func checkAuthorization() async {
        let status = AuthorizationCenter.shared.authorizationStatus
        isAuthorized = status == .approved
    }
}
