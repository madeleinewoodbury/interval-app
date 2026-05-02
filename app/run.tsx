import React, { useEffect, useMemo } from "react"
import { Text, View, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useTimer } from "../src/context/TimerProvider"
import { useSettings } from "../src/context/SettingsProvider"
import {
  generateThemeFromTimer,
  neutralTheme,
} from "../src/utils/themeGenerator"
import ProgressRing from "../src/components/ProgressRing"
import * as Haptics from "expo-haptics"
import { AntDesign } from "@expo/vector-icons"

export default function RunScreen() {
  const {
    state,
    start,
    pause,
    resume,
    restart,
    engine,
    startLastOrFirst,
    timers,
    loadingTimers,
  } = useTimer()
  const router = useRouter()
  const { settings } = useSettings()
  const attemptedAutoStart = React.useRef(false)

  // Auto-start last or first timer when entering Run tab if idle
  useEffect(() => {
    if (state.kind !== "idle") {
      attemptedAutoStart.current = false
      return
    }
    if (loadingTimers) return
    if (attemptedAutoStart.current) return

    attemptedAutoStart.current = true
    if (!engine.currentSpec && timers.length > 0) {
      startLastOrFirst()
    }
  }, [state.kind, loadingTimers, timers.length, engine, startLastOrFirst])

  // Generate theme from current timer, fallback to neutral if no timer loaded
  const currentTheme = useMemo(
    () =>
      engine.currentSpec
        ? generateThemeFromTimer(engine.currentSpec)
        : neutralTheme,
    [engine.currentSpec],
  )

  const activeSegment =
    state.kind === "running" || state.kind === "paused"
      ? engine.currentSpec?.segments[state.segmentIndex]
      : undefined
  const activeSegmentKey = activeSegment?.id

  // Hoist for stable useMemo dep checking
  const runningSegmentIndex =
    state.kind === "running" ? state.segmentIndex : null

  const colors = useMemo(() => {
    const runningSegment =
      state.kind === "running"
        ? engine.currentSpec?.segments[state.segmentIndex]
        : undefined

    const bg = (() => {
      if (runningSegment) {
        return runningSegment.id === "work"
          ? currentTheme.work.background
          : currentTheme.rest.background
      }
      if (state.kind === "countdown") return currentTheme.states.countdown
      if (state.kind === "finished") return currentTheme.states.finished
      if (state.kind === "paused") return currentTheme.states.paused
      return currentTheme.ui.background
    })()

    const text = runningSegment
      ? runningSegment.id === "work"
        ? currentTheme.work.text
        : currentTheme.rest.text
      : currentTheme.ui.textPrimary

    const textSecondary = runningSegment
      ? runningSegment.id === "work"
        ? currentTheme.work.textSecondary
        : currentTheme.rest.textSecondary
      : currentTheme.ui.textSecondary

    const ring = runningSegment
      ? runningSegment.id === "work"
        ? currentTheme.work.text
        : currentTheme.rest.text
      : currentTheme.ui.accent

    const playBg = !activeSegmentKey
      ? currentTheme.ui.buttonPrimary
      : activeSegmentKey === "work"
        ? currentTheme.rest.background
        : currentTheme.work.background

    const playIcon = !activeSegmentKey
      ? currentTheme.ui.textPrimary
      : activeSegmentKey === "work"
        ? currentTheme.rest.text
        : currentTheme.work.text

    return {
      bg,
      text,
      textSecondary,
      ring,
      playBg,
      playIcon,
      replayBg: currentTheme.ui.cardBackground,
    }
    // state.segmentIndex is captured via runningSegmentIndex above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.kind,
    runningSegmentIndex,
    activeSegmentKey,
    currentTheme,
    engine.currentSpec,
  ])

  // Track initial segment / countdown seconds to compute progress
  const initSeg = React.useRef<number>(0)
  const currentSegmentIndex = React.useRef<number>(-1)
  const initCountdown = React.useRef<number>(0)
  const wasInCountdown = React.useRef<boolean>(false)

  React.useEffect(() => {
    if (state.kind === "running") {
      wasInCountdown.current = false
      // Reset progress when segment changes
      if (currentSegmentIndex.current !== state.segmentIndex) {
        currentSegmentIndex.current = state.segmentIndex
        const currentSegment = engine.currentSpec?.segments[state.segmentIndex]
        initSeg.current = currentSegment?.seconds || 1
      }

      // Fallback if initSeg wasn't set properly
      if (initSeg.current === 0) {
        initSeg.current = state.remaining || 1
      }
    } else if (state.kind === "countdown") {
      if (!wasInCountdown.current) {
        wasInCountdown.current = true
        const specCountdown = engine.currentSpec?.options?.countdown ?? 0
        initCountdown.current =
          specCountdown > 0 ? specCountdown : Math.max(1, state.remaining)
      }
    } else {
      wasInCountdown.current = false
      currentSegmentIndex.current = -1
    }
  }, [state, engine.currentSpec])

  const progress =
    state.kind === "running" && initSeg.current
      ? 1 - state.remaining / initSeg.current
      : state.kind === "countdown" && initCountdown.current
        ? 1 - state.remaining / initCountdown.current
        : 0

  // Single vibration when countdown starts (respect user/timer settings)
  React.useEffect(() => {
    if (state.kind !== "countdown") return
    if (!settings.hapticsEnabled) return
    const haptics = engine.currentSpec?.options?.haptics
    if (haptics === "off") return
    const pattern =
      haptics === "strong"
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light
    Haptics.impactAsync(pattern).catch(() => {})
    // Only fire once per entry into countdown; depending on state.kind keeps it stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind])

  const big = (() => {
    if (state.kind === "running" || state.kind === "paused")
      return `${Math.ceil(state.remaining).toString().padStart(2, "0")}`
    if (state.kind === "countdown") return `${Math.ceil(state.remaining)}`
    if (state.kind === "finished") return "DONE"
    return "READY"
  })()

  const sub = (() => {
    if (state.kind === "running") {
      const totalRounds = engine.currentSpec?.rounds || 1
      return `Round ${state.round} of ${totalRounds}`
    }
    if (state.kind === "paused") return "Paused"
    if (state.kind === "countdown") return "Get Ready"
    if (state.kind === "finished") return "Great work"
    return ""
  })()

  const hasNoTimers =
    !loadingTimers && timers.length === 0 && !engine.currentSpec

  if (hasNoTimers) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: currentTheme.ui.background }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            gap: 12,
          }}
        >
          <Text
            style={{
              color: currentTheme.ui.textPrimary,
              fontSize: 28,
              fontWeight: "800",
            }}
          >
            No timer to run
          </Text>
          <Text
            style={{
              color: currentTheme.ui.textSecondary,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Create a timer first, then come back to Run.
          </Text>
          <Pressable
            onPress={() => router.push("/create-timer")}
            style={{
              marginTop: 8,
              paddingVertical: 14,
              paddingHorizontal: 18,
              backgroundColor: currentTheme.ui.buttonPrimary,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: currentTheme.ui.textPrimary,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Create Timer
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <ProgressRing
          size={260}
          stroke={10}
          progress={Math.max(0, Math.min(1, progress))}
          color={colors.ring}
        />
        <Text
          style={{
            color: colors.text,
            fontSize: 96,
            fontWeight: "800",
            letterSpacing: 1,
          }}
        >
          {big}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 18 }}>{sub}</Text>
      </View>

      <View
        style={{
          padding: 16,
          flexDirection: "row",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={restart}
          accessibilityRole="button"
          accessibilityLabel="Restart timer"
          style={{
            paddingVertical: 14,
            paddingHorizontal: 18,
            backgroundColor: colors.replayBg,
            borderRadius: 12,
          }}
        >
          <AntDesign
            name="reload"
            size={20}
            color={currentTheme.ui.textPrimary}
          />
        </Pressable>

        {state.kind === "running" ? (
          <Pressable
            onPress={pause}
            accessibilityRole="button"
            accessibilityLabel="Pause timer"
            style={{
              paddingVertical: 14,
              paddingHorizontal: 18,
              backgroundColor: currentTheme.ui.buttonPrimary,
              borderRadius: 14,
            }}
          >
            <AntDesign
              name="pause-circle"
              size={24}
              color={currentTheme.ui.textPrimary}
            />
          </Pressable>
        ) : state.kind === "paused" ? (
          <Pressable
            onPress={resume}
            accessibilityRole="button"
            accessibilityLabel="Resume timer"
            style={{
              paddingVertical: 14,
              paddingHorizontal: 18,
              backgroundColor: colors.playBg,
              borderRadius: 14,
            }}
          >
            <AntDesign name="play-circle" size={24} color={colors.playIcon} />
          </Pressable>
        ) : (
          <Pressable
            onPress={start}
            accessibilityRole="button"
            accessibilityLabel="Start timer"
            style={{
              paddingVertical: 14,
              paddingHorizontal: 18,
              backgroundColor: colors.playBg,
              borderRadius: 14,
            }}
          >
            <AntDesign name="play-circle" size={24} color={colors.playIcon} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}
