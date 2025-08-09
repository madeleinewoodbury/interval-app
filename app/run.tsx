import React from "react"
import { SafeAreaView, Text, View, Pressable } from "react-native"
import { useTimer } from "../src/context/TimerProvider"
import ProgressRing from "../src/components/ProgressRing"
import * as Haptics from "expo-haptics"
import { AntDesign } from "@expo/vector-icons"

export default function RunScreen() {
  const { state, start, pause, resume, restart } = useTimer()

  const bgColor = (() => {
    if (state.kind === "running") return undefined // set below per segment via label color? kept simple
    if (state.kind === "countdown") return "#111827"
    if (state.kind === "finished") return "#065F46"
    return "#0B0B0F"
  })()

  // crude progress: remaining / segment seconds
  const currentProgress = (() => {
    if (state.kind !== "running") return 0
    const segSecs = state.remaining // we only know remaining; we’ll pass initial in a ref
    return 1 - 0 // updated below with a ref
  })()

  // Track initial segment seconds to compute progress
  const initSeg = React.useRef<number>(0)
  React.useEffect(() => {
    if (state.kind === "running") {
      if (state.remaining && state.remaining > initSeg.current)
        initSeg.current = state.remaining
      if (initSeg.current === 0) initSeg.current = state.remaining || 1
    }
  }, [state])

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
    if (state.kind === "running") return `Round ${state.round}`
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
          color="#60A5FA"
        />
        <Text
          style={{
            color: "white",
            fontSize: 96,
            fontWeight: "800",
            letterSpacing: 1,
          }}
        >
          {big}
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 18 }}>{sub}</Text>
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
            backgroundColor: "#1F2937",
            borderRadius: 12,
          }}
        >
          <AntDesign name="reload1" size={20} color="white" />
        </Pressable>

        {state.kind === "running" ? (
          <Pressable
            onPress={pause}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 24,
              backgroundColor: "#2563EB",
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 18 }}>
              Pause
            </Text>
          </Pressable>
        ) : state.kind === "paused" ? (
          <Pressable
            onPress={resume}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 24,
              backgroundColor: "#10B981",
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 18 }}>
              Resume
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={start}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 24,
              backgroundColor: "#10B981",
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 18 }}>
              Start
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}
