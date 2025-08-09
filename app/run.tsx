import React from "react"
import { SafeAreaView, Text, View, Pressable } from "react-native"
import { useTimer } from "../src/context/TimerProvider"
import {
  generateThemeFromTimer,
  neutralTheme,
} from "../src/utils/themeGenerator"
import ProgressRing from "../src/components/ProgressRing"
import * as Haptics from "expo-haptics"
import { AntDesign } from "@expo/vector-icons"

export default function RunScreen() {
  const { state, start, pause, resume, restart, engine } = useTimer()

  // Generate theme from current timer, fallback to neutral if no timer loaded
  const currentTheme = engine.currentSpec
    ? generateThemeFromTimer(engine.currentSpec)
    : neutralTheme

  const bgColor = (() => {
    if (state.kind === "running") {
      // Get current segment to determine work/rest colors
      const currentSegment = engine.currentSpec?.segments[state.segmentIndex]
      if (currentSegment) {
        return currentSegment.id === "work"
          ? currentTheme.work.background
          : currentTheme.rest.background
      }
      return currentTheme.ui.background
    }
    if (state.kind === "countdown") return currentTheme.states.countdown
    if (state.kind === "finished") return currentTheme.states.finished
    if (state.kind === "paused") return currentTheme.states.paused
    return currentTheme.ui.background
  })()

  const textColor = (() => {
    if (state.kind === "running") {
      const currentSegment = engine.currentSpec?.segments[state.segmentIndex]
      if (currentSegment) {
        return currentSegment.id === "work"
          ? currentTheme.work.text
          : currentTheme.rest.text
      }
    }
    return currentTheme.ui.textPrimary
  })()

  const textSecondaryColor = (() => {
    if (state.kind === "running") {
      const currentSegment = engine.currentSpec?.segments[state.segmentIndex]
      if (currentSegment) {
        return currentSegment.id === "work"
          ? currentTheme.work.textSecondary
          : currentTheme.rest.textSecondary
      }
    }
    return currentTheme.ui.textSecondary
  })()

  const ringColor = (() => {
    if (state.kind === "running") {
      const currentSegment = engine.currentSpec?.segments[state.segmentIndex]
      if (currentSegment) {
        return currentSegment.id === "work"
          ? currentTheme.work.text
          : currentTheme.rest.text
      }
    }
    return currentTheme.ui.accent
  })()

  // crude progress: remaining / segment seconds
  const currentProgress = (() => {
    if (state.kind !== "running") return 0
    const segSecs = state.remaining // we only know remaining; we’ll pass initial in a ref
    return 1 - 0 // updated below with a ref
  })()

  // Track initial segment seconds to compute progress
  const initSeg = React.useRef<number>(0)
  const currentSegmentIndex = React.useRef<number>(-1)

  React.useEffect(() => {
    if (state.kind === "running") {
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
    }
  }, [state, engine.currentSpec])

  const progress =
    state.kind === "running" && initSeg.current
      ? 1 - state.remaining / initSeg.current
      : state.kind === "countdown"
        ? 1 - state.remaining / Math.max(1, state.remaining)
        : 0

  // Single vibration when countdown starts
  React.useEffect(() => {
    if (state.kind === "countdown") {
      // Only vibrate once when countdown begins, not on every tick
      const timer = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }, 0)
      return () => clearTimeout(timer)
    }
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
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
          color={ringColor}
        />
        <Text
          style={{
            color: textColor,
            fontSize: 96,
            fontWeight: "800",
            letterSpacing: 1,
          }}
        >
          {big}
        </Text>
        <Text style={{ color: textSecondaryColor, fontSize: 18 }}>{sub}</Text>
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
          style={{
            paddingVertical: 14,
            paddingHorizontal: 18,
            backgroundColor: currentTheme.ui.buttonSecondary,
            borderRadius: 12,
          }}
        >
          <AntDesign
            name="reload1"
            size={20}
            color={currentTheme.ui.textPrimary}
          />
        </Pressable>

        {state.kind === "running" ? (
          <Pressable
            onPress={pause}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 18,
              backgroundColor: currentTheme.ui.buttonPrimary,
              borderRadius: 14,
            }}
          >
            <AntDesign
              name="pausecircleo"
              size={24}
              color={currentTheme.ui.textPrimary}
            />
          </Pressable>
        ) : state.kind === "paused" ? (
          <Pressable
            onPress={resume}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 18,
              backgroundColor: currentTheme.ui.success,
              borderRadius: 14,
            }}
          >
            <AntDesign
              name="playcircleo"
              size={24}
              color={currentTheme.ui.textPrimary}
            />
          </Pressable>
        ) : (
          <Pressable
            onPress={start}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 18,
              backgroundColor: currentTheme.ui.success,
              borderRadius: 14,
            }}
          >
            <AntDesign
              name="playcircleo"
              size={24}
              color={currentTheme.ui.textPrimary}
            />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}
