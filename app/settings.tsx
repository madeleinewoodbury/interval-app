import React from "react"
import {
  View,
  Text,
  Switch,
  ScrollView,
  useColorScheme,
  StyleSheet,
} from "react-native"
import { useSettings } from "../src/context/SettingsProvider"
import { chooseNeutralTheme } from "../src/utils/themeGenerator"
import { COLORS } from "../src/constants/colors"

const THEME_OPTIONS = ["system", "light", "dark"] as const

type RowProps = {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  description?: string
  borderColor: string
  isLight: boolean
  textPrimary: string
  textSecondary: string
}

const SettingsRow: React.FC<RowProps> = ({
  label,
  value,
  onChange,
  description,
  borderColor,
  isLight,
  textPrimary,
  textSecondary,
}) => (
  <View style={[styles.row, { borderBottomColor: borderColor }]}>
    <View style={styles.rowInner}>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: textPrimary }]}>{label}</Text>
        {description ? (
          <Text style={[styles.rowDescription, { color: textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: isLight ? COLORS.slate300 : COLORS.slate600,
          true: COLORS.indigo600,
        }}
        ios_backgroundColor={isLight ? COLORS.slate300 : COLORS.slate600}
        thumbColor={isLight ? COLORS.white : COLORS.slate50}
      />
    </View>
  </View>
)

type ThemeRowProps = {
  selectedTheme: "system" | "light" | "dark"
  onSelectTheme: (mode: "system" | "light" | "dark") => void
  textPrimary: string
  textSecondary: string
  accent: string
}

const ThemePreferenceRow: React.FC<ThemeRowProps> = ({
  selectedTheme,
  onSelectTheme,
  textPrimary,
  textSecondary,
  accent,
}) => (
  <View style={styles.themeRow}>
    <Text style={[styles.themeTitle, { color: textPrimary }]}>Theme</Text>
    {THEME_OPTIONS.map((mode) => {
      const selected = selectedTheme === mode
      return (
        <Text
          key={mode}
          onPress={() => onSelectTheme(mode)}
          style={[
            styles.themeOption,
            selected
              ? {
                  color: accent,
                  fontWeight: "700",
                }
              : [styles.themeOptionUnselected, { color: textSecondary }],
          ]}
        >
          {mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}{" "}
          {selected ? "✓" : ""}
        </Text>
      )
    })}
  </View>
)

export default function SettingsScreen() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const systemScheme = useColorScheme()

  const effectiveTheme =
    settings.themePreference === "system"
      ? systemScheme
      : settings.themePreference
  const isLight = effectiveTheme === "light"
  const theme = chooseNeutralTheme(isLight ? "light" : "dark")
  const borderColor = isLight
    ? theme.ui.buttonSecondary
    : theme.ui.cardBackground

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.ui.background }]}
      contentContainerStyle={styles.screenContent}
    >
      <View style={[styles.card, { backgroundColor: theme.ui.cardBackground }]}>
        <Text style={[styles.title, { color: theme.ui.textPrimary }]}>
          Preferences
        </Text>
        <Text style={[styles.subtitle, { color: theme.ui.textSecondary }]}>
          Control audio, haptics, countdown and theme.
        </Text>
        <SettingsRow
          label="Sounds"
          value={settings.soundsEnabled}
          description="Play beeps for segment transitions and completion"
          onChange={(v) => updateSettings({ soundsEnabled: v })}
          borderColor={borderColor}
          isLight={isLight}
          textPrimary={theme.ui.textPrimary}
          textSecondary={theme.ui.textSecondary}
        />
        <SettingsRow
          label="Haptics"
          value={settings.hapticsEnabled}
          description="Vibration feedback on transitions"
          onChange={(v) => updateSettings({ hapticsEnabled: v })}
          borderColor={borderColor}
          isLight={isLight}
          textPrimary={theme.ui.textPrimary}
          textSecondary={theme.ui.textSecondary}
        />
        <SettingsRow
          label="Countdown beeps"
          value={settings.countdownBeepsEnabled}
          description="Play 3-2-1 beeps before start and at end of segments"
          onChange={(v) => updateSettings({ countdownBeepsEnabled: v })}
          borderColor={borderColor}
          isLight={isLight}
          textPrimary={theme.ui.textPrimary}
          textSecondary={theme.ui.textSecondary}
        />
        <ThemePreferenceRow
          selectedTheme={settings.themePreference}
          onSelectTheme={(mode) => updateSettings({ themePreference: mode })}
          textPrimary={theme.ui.textPrimary}
          textSecondary={theme.ui.textSecondary}
          accent={theme.ui.accent}
        />
      </View>
      <Text
        onPress={() => resetSettings()}
        style={[styles.resetText, { color: theme.ui.accent }]}
      >
        Reset to defaults
      </Text>
      <Text style={[styles.versionText, { color: theme.ui.textSecondary }]}>
        Interval Pro v1.0.0
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  themeRow: {
    paddingVertical: 12,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  themeOption: {
    paddingVertical: 8,
  },
  themeOptionUnselected: {
    fontWeight: "400",
  },
  resetText: {
    textAlign: "center",
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
  },
})
