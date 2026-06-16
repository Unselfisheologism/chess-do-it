import SwiftUI
import FamilyControls
import ManagedSettings
import DeviceActivity

struct ContentView: View {
    @State private var isAuthorized = false
    @State private var shieldEnabled = true
    @State private var showingPicker = false
    @State private var selectedApps = FamilyActivitySelection()
    @State private var unlockedUntil = Date()
    @State private var dailyGoalMet = false
    @State private var showMockBanner = true

    let store = ManagedSettingsStore()

    var isLocked: Bool {
        shieldEnabled && !dailyGoalMet && Date() > unlockedUntil
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Mock Mode Banner
                    if showMockBanner {
                        mockBanner
                    }

                    // Shield Status Card
                    shieldStatusCard

                    // Authorization Section
                    if !isAuthorized {
                        authorizationCard
                    }

                    // Blocked Apps Section
                    if isAuthorized {
                        blockedAppsSection
                    }

                    // How It Works
                    howItWorksSection
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.10, blue: 0.14))
            .navigationTitle("Focus Shield")
            .navigationBarTitleDisplayMode(.large)
            .familyActivityPicker(
                isPresented: $showingPicker,
                selection: $selectedApps
            )
            .onChange(of: selectedApps) { _, newSelection in
                applyShields()
            }
            .task {
                await requestAuthorization()
            }
        }
    }

    // MARK: - Mock Banner

    var mockBanner: some View {
        HStack(spacing: 8) {
            Image(systemName: "info.circle.fill")
                .foregroundStyle(.orange)
            Text("Mock Mode: Real blocking requires Apple's Family Controls entitlement approval. This demonstrates the full UX flow.")
                .font(.caption)
                .foregroundStyle(.orange)
            Spacer()
            Button {
                withAnimation { showMockBanner = false }
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.orange.opacity(0.6))
            }
        }
        .padding(12)
        .background(.orange.opacity(0.1))
        .clipShape(.rect(cornerRadius: 12))
    }

    // MARK: - Shield Status Card

    var shieldStatusCard: some View {
        VStack(spacing: 12) {
            Image(systemName: isLocked ? "shield.slash.fill" : "shield.checkered")
                .font(.system(size: 48))
                .foregroundStyle(isLocked ? .red : .green)
                .symbolEffect(.bounce, value: isLocked)

            Text(isLocked ? "Social Media Locked" : "Shield Active")
                .font(.title2.bold())
                .foregroundStyle(.white)

            Text(isLocked
                 ? "Complete your daily chess lesson in ChessQuest to unlock"
                 : "Daily goal met! Social media is unlocked.")
                .font(.subheadline)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)

            // Toggle
            HStack(spacing: 12) {
                Text("Shield")
                    .foregroundStyle(.gray)
                Toggle("", isOn: $shieldEnabled)
                    .labelsHidden()
                    .tint(.green)
                    .onChange(of: shieldEnabled) { _, enabled in
                        if enabled {
                            applyShields()
                        } else {
                            removeShields()
                        }
                    }
            }
            .padding(.top, 4)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(red: 0.09, green: 0.13, blue: 0.20))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isLocked ? Color.red.opacity(0.5) : Color.green.opacity(0.3), lineWidth: 2)
                )
        )
    }

    // MARK: - Authorization Card

    var authorizationCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "hand.raised.fill")
                .font(.largeTitle)
                .foregroundStyle(.blue)

            Text("Authorize Screen Time")
                .font(.headline)
                .foregroundStyle(.white)

            Text("ChessQuest needs your permission to block distracting apps when you haven't completed your daily lesson.")
                .font(.caption)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)

            Button {
                Task { await requestAuthorization() }
            } label: {
                Label("Authorize", systemImage: "checkmark.shield.fill")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(.blue)
                    .foregroundStyle(.white)
                    .clipShape(.rect(cornerRadius: 12))
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(red: 0.09, green: 0.13, blue: 0.20))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(.blue.opacity(0.3), lineWidth: 1)
                )
        )
    }

    // MARK: - Blocked Apps Section

    var blockedAppsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Blocked Apps")
                .font(.headline)
                .foregroundStyle(.white)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(socialApps, id: \.self) { app in
                    let isBlocked = isAppBlocked(app)
                    HStack(spacing: 8) {
                        Image(systemName: appIcon(for: app))
                            .font(.title3)
                            .foregroundStyle(isBlocked ? .red : .gray)
                        Text(app)
                            .font(.caption)
                            .foregroundStyle(isBlocked ? .white : .gray)
                        Spacer()
                        Image(systemName: isLocked && isBlocked ? "lock.fill" : "lock.open.fill")
                            .font(.caption2)
                            .foregroundStyle(isBlocked ? .red : .green)
                    }
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(isBlocked ? Color.red.opacity(0.1) : Color(red: 0.09, green: 0.13, blue: 0.20))
                    )
                }
            }

            Button {
                showingPicker = true
            } label: {
                Label("Choose Apps to Block", systemImage: "plus.circle")
                    .font(.caption)
                    .foregroundStyle(.blue)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(red: 0.09, green: 0.13, blue: 0.20))
        )
    }

    // MARK: - How It Works

    var howItWorksSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("How Focus Shield Works")
                .font(.headline)
                .foregroundStyle(.white)

            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                HStack(alignment: .top, spacing: 10) {
                    Text("\(index + 1)")
                        .font(.caption.bold())
                        .foregroundStyle(.black)
                        .frame(width: 24, height: 24)
                        .background(.yellow)
                        .clipShape(Circle())

                    Text(step)
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
            }

            Text("Built with Apple Screen Time APIs — requires Family Controls entitlement for production use.")
                .font(.caption2)
                .foregroundStyle(.gray.opacity(0.5))
                .padding(.top, 8)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(red: 0.09, green: 0.13, blue: 0.20))
        )
    }

    // MARK: - Helpers

    let socialApps = [
        "Instagram", "TikTok", "Facebook", "X (Twitter)",
        "Snapchat", "YouTube", "Reddit", "Discord",
    ]

    let steps = [
        "Authorize ChessQuest to manage Screen Time on your device.",
        "Select which social media apps you want to block when you haven't learned.",
        "Complete your daily chess lesson in ChessQuest to unlock access.",
        "Apps re-lock after 3 hours or at midnight — keep learning to stay unlocked!",
    ]

    func appIcon(for app: String) -> String {
        switch app {
        case "Instagram": return "camera.fill"
        case "TikTok": return "music.note"
        case "Facebook": return "f.circle.fill"
        case "X (Twitter)": return "bird.fill"
        case "Snapchat": return "ghost.fill"
        case "YouTube": return "play.rectangle.fill"
        case "Reddit": return "bubble.left.and.bubble.right.fill"
        case "Discord": return "headphones"
        default: return "app.fill"
        }
    }

    func isAppBlocked(_ app: String) -> Bool {
        // In mock mode, show all as blocked when shield is on
        shieldEnabled
    }

    func requestAuthorization() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            isAuthorized = true
        } catch {
            // Authorization denied or unavailable in simulator
            isAuthorized = false
        }
    }

    func applyShields() {
        guard isAuthorized else { return }
        let categories = selectedApps.categoryTokens
        let apps = selectedApps.applicationTokens

        store.shield.applications = apps.isEmpty ? nil : apps
        store.shield.applicationCategories = categories.isEmpty
            ? nil
            : .specific(categories)
        store.shield.webDomains = selectedApps.webDomainTokens.isEmpty
            ? nil
            : selectedApps.webDomainTokens
    }

    func removeShields() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
    }
}

#Preview {
    ContentView()
}
