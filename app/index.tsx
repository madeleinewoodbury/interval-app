import React, { useCallback } from "react"
import {
  Pressable,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from "react-native"
import { useRouter } from "expo-router"
import { useTimer } from "../src/context/TimerProvider"
import { neutralTheme, chooseNeutralTheme } from "../src/utils/themeGenerator"
import { useSettings } from "../src/context/SettingsProvider"
import { TimerSpec } from "../src/types"
import { AntDesign } from "@expo/vector-icons"
import { COLORS } from "../src/constants/colors"
import { formatDurationLabel } from "../src/utils/formatDuration"

// Timer card component
const TimerCard = React.memo(function TimerCard({
  timer,
  theme,
  isLight,
  onPress,
  onLongPress,
}: {
  timer: TimerSpec
  theme: typeof neutralTheme
  isLight: boolean
  onPress: (timer: TimerSpec) => void
  onLongPress: (timer: TimerSpec) => void
}) {
  const handlePress = useCallback(() => onPress(timer), [onPress, timer])
  const handleLongPress = useCallback(
    () => onLongPress(timer),
    [onLongPress, timer],
  )
  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.ui.cardBackground,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderLeftWidth: 4,
        borderLeftColor: timer.segments[0]?.color || theme.ui.accent,
        borderWidth: isLight ? 1 : 0,
        borderColor: isLight ? COLORS.slate200 : "transparent",
        shadowColor: isLight ? COLORS.slate900 : "transparent",
        shadowOffset: { width: 0, height: isLight ? 2 : 0 },
        shadowOpacity: isLight ? 0.08 : 0,
        shadowRadius: isLight ? 8 : 0,
        elevation: isLight ? 2 : 0,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.ui.textPrimary,
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          {timer.name}
        </Text>
        <Text style={{ color: theme.ui.textSecondary, marginTop: 4 }}>
          {timer.segments
            .map((s) => `${s.label} ${formatDurationLabel(s.seconds)}`)
            .join(" / ")}{" "}
          ×{" "}
          {timer.rounds}
        </Text>
        <View style={{ flexDirection: "row", marginTop: 6, gap: 8 }}>
          {timer.segments.map((segment) => (
            <View
              key={segment.id}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: segment.color,
              }}
            />
          ))}
        </View>
      </View>
      <AntDesign name="right" size={20} color={theme.ui.accent} />
    </Pressable>
  )
})

export default function TimersScreen() {
  const { timers, loadingTimers, loadTimer, deleteTimer } = useTimer()
  const router = useRouter()

  const { settings } = useSettings()
  const systemScheme = useColorScheme() || "light"
  const pref =
    settings.themePreference === "system"
      ? systemScheme
      : settings.themePreference
  const isLight = pref === "light"
  const theme = chooseNeutralTheme(pref === "light" ? "light" : "dark")

  const handleAddTimer = useCallback(() => {
    router.push("/create-timer")
  }, [router])

  const handleDeleteTimer = useCallback(
    (timer: TimerSpec) => {
      Alert.alert(
        "Delete Timer",
        `Are you sure you want to delete "${timer.name}"? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteTimer(timer.id)
              } catch {
                Alert.alert(
                  "Error",
                  "Failed to delete timer. Please try again.",
                )
              }
            },
          },
        ],
      )
    },
    [deleteTimer],
  )

  const handleTimerPress = useCallback(
    (timer: TimerSpec) => {
      loadTimer(timer)
      router.push("/run")
    },
    [loadTimer, router],
  )

  const handleTimerLongPress = useCallback(
    (timer: TimerSpec) => {
      Alert.alert(timer.name, "What would you like to do?", [
        {
          text: "Edit",
          onPress: () => router.push(`/create-timer?id=${timer.id}`),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteTimer(timer),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ])
    },
    [router, handleDeleteTimer],
  )

  if (loadingTimers) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.ui.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.ui.accent} />
        <Text style={{ color: theme.ui.textSecondary, marginTop: 8 }}>
          Loading timers...
        </Text>
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.ui.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          paddingBottom: 8,
        }}
      >
        <View>
          <Text
            style={{
              color: theme.ui.textPrimary,
              fontSize: 28,
              fontWeight: "800",
              marginBottom: 2,
            }}
          >
            Interval Pro
          </Text>
          <Text
            style={{
              color: theme.ui.textSecondary,
              fontSize: 16,
              fontWeight: "500",
            }}
          >
            Timers
          </Text>
        </View>
        <Pressable
          onPress={handleAddTimer}
          accessibilityRole="button"
          accessibilityLabel="Create timer"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.ui.buttonPrimary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AntDesign name="plus" size={20} color={COLORS.white} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/** Removed Run Last Timer button; auto-start handled when entering Run tab */}
        {timers.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 60,
            }}
          >
            <AntDesign
              name="clock-circle"
              size={48}
              color={theme.ui.textSecondary}
            />
            <Text
              style={{
                color: theme.ui.textSecondary,
                fontSize: 18,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              No timers yet
            </Text>
            <Text
              style={{
                color: theme.ui.textSecondary,
                fontSize: 14,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Tap the + button to create your first timer
            </Text>
          </View>
        ) : (
          timers.map((timer) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              theme={theme}
              isLight={isLight}
              onPress={handleTimerPress}
              onLongPress={handleTimerLongPress}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}
