import AppIntents

struct ChessQuestDeviceMonitorIntent: AppIntent {
    static var title: LocalizedStringResource = "ChessQuestDeviceMonitor"
    static var description = IntentDescription("An example app intent.")

    func perform() async throws -> some IntentResult {
        return .result()
    }
}
