import React from "react"
import { View, Text, Switch, ScrollView, useColorScheme } from "react-native"
import { useSettings } from "../src/context/SettingsProvider"

export default function SettingsScreen() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const systemScheme = useColorScheme()

  const effectiveTheme =
    settings.themePreference === "system"
      ? systemScheme
      : settings.themePreference
  const isLight = effectiveTheme === "light"

  const bg = isLight ? "#F8FAFC" : "#0F172A"
  const card = isLight ? "#FFFFFF" : "#1E293B"
  const textPrimary = isLight ? "#0F172A" : "#FFFFFF"
  const textSecondary = isLight ? "#475569" : "#94A3B8"
  const accent = "#3B82F6"

  const Row: React.FC<{
    label: string
    value: boolean
    onChange: (v: boolean) => void
    description?: string
  }> = ({ label, value, onChange, description }) => (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: isLight ? "#E2E8F0" : "#334155",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "600" }}>
            {label}
          </Text>
          {description ? (
            <Text
              style={{
                color: textSecondary,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {description}
            </Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          thumbColor={value ? accent : undefined}
        />
      </View>
    </View>
  )

  const ThemeRow: React.FC = () => (
    <View style={{ paddingVertical: 12 }}>
      <Text
        style={{
          color: textPrimary,
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 8,
        }}
      >
        Theme
      </Text>
      {(["system", "light", "dark"] as const).map((mode) => {
        const selected = settings.themePreference === mode
        return (
          <Text
            key={mode}
            onPress={() => updateSettings({ themePreference: mode })}
            style={{
              paddingVertical: 8,
              color: selected ? accent : textPrimary,
              fontWeight: selected ? "700" : "400",
            }}
          >
            {mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}{" "}
            {selected ? "✓" : ""}
          </Text>
        )
      })}
    </View>
  )

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16 }}
    >
      <View
        style={{
          backgroundColor: card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            color: textPrimary,
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 4,
          }}
        >
          Preferences
        </Text>
        <Text
          style={{
            color: textSecondary,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          Control audio, haptics, countdown and theme.
        </Text>
        <Row
          label="Sounds"
          value={settings.soundsEnabled}
          description="Play beeps for segment transitions and completion"
          onChange={(v) => updateSettings({ soundsEnabled: v })}
        />
        <Row
          label="Haptics"
          value={settings.hapticsEnabled}
          description="Vibration feedback on transitions"
          onChange={(v) => updateSettings({ hapticsEnabled: v })}
        />
        <Row
          label="Countdown beeps"
          value={settings.countdownBeepsEnabled}
          description="Play 3-2-1 beeps before start and at end of segments"
          onChange={(v) => updateSettings({ countdownBeepsEnabled: v })}
        />
        <ThemeRow />
      </View>
      <Text
        onPress={() => resetSettings()}
        style={{ color: accent, textAlign: "center", fontWeight: "600" }}
      >
        Reset to defaults
      </Text>
      <Text
        style={{
          textAlign: "center",
          marginTop: 24,
          color: textSecondary,
          fontSize: 12,
        }}
      >
        Interval Pro v1.0.0
      </Text>
    </ScrollView>
  )
}
