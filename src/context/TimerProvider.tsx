import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react"
import { useKeepAwake } from "expo-keep-awake"
import { AppState, Alert } from "react-native"
import * as Haptics from "expo-haptics"
import * as Device from "expo-device"
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio"
import { TimerEngine } from "../engine/timerEngine"
import { EngineState, TimerSpec } from "../types"
import { TimerStorage } from "../services/TimerStorage"
import { NotificationService } from "../services/NotificationService"
import { useSettings } from "./SettingsProvider"
import AsyncStorage from "@react-native-async-storage/async-storage"

type Ctx = {
  // Timer engine
  engine: TimerEngine
  state: EngineState
  loadTimer: (t: TimerSpec) => void
  startLastOrFirst: () => Promise<void>
  start: () => void
  pause: () => void
  resume: () => void
  restart: () => void

  // Timer management
  timers: TimerSpec[]
  loadingTimers: boolean
  refreshTimers: () => Promise<void>
  saveTimer: (timer: TimerSpec) => Promise<void>
  updateTimer: (id: string, timer: TimerSpec) => Promise<void>
  deleteTimer: (id: string) => Promise<void>
  getTimer: (id: string) => TimerSpec | undefined
}

const TimerCtx = createContext<Ctx | null>(null)
export const useTimer = () => {
  const v = useContext(TimerCtx)
  if (!v) throw new Error("TimerProvider missing")
  return v
}

const soundMap: Record<string, number> = {
  beep_1: require("../../assets/sounds/beep_1.mp3"),
  beep_2: require("../../assets/sounds/beep_2.mp3"),
  completed: require("../../assets/sounds/completed.mp3"),
}

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useKeepAwake()
  const engine = useMemo(() => new TimerEngine(), [])
  const { settings } = useSettings()
  const [state, setState] = useState<EngineState>({ kind: "idle" })
  const currentTimer = useRef<TimerSpec | null>(null)
  const LAST_TIMER_KEY = "last_selected_timer_id_v1"

  // Timer management state
  const [timers, setTimers] = useState<TimerSpec[]>([])
  const [loadingTimers, setLoadingTimers] = useState(true)

  // App state management
  const appState = useRef(AppState.currentState)
  const backgroundAt = useRef<number | null>(null)
  const latestState = useRef<EngineState>({ kind: "idle" })

  // Audio players (pre-created on mount)
  const soundCache = useRef<Record<string, AudioPlayer | null>>({})

  // Pre-create audio players on mount
  useEffect(() => {
    for (const key of Object.keys(soundMap)) {
      soundCache.current[key] = createAudioPlayer(soundMap[key])
    }
    return () => {
      for (const player of Object.values(soundCache.current)) {
        player?.remove()
      }
      soundCache.current = {}
    }
  }, [])

  const play = useCallback(async (key?: string) => {
    if (!key) return
    try {
      const player = soundCache.current[key]
      if (player) {
        await player.seekTo(0)
        player.play()
      }
    } catch (error) {
      console.error(`Error playing sound ${key}:`, error)
    }
  }, [])

  const stopAllSounds = useCallback(async () => {
    for (const player of Object.values(soundCache.current)) {
      try {
        player?.pause()
      } catch {
        /* ignore */
      }
    }
  }, [])

  // Timer management functions
  const refreshTimers = useCallback(async () => {
    try {
      setLoadingTimers(true)
      const savedTimers = await TimerStorage.getTimers()
      setTimers(savedTimers)
    } catch (error) {
      console.error("Error loading timers:", error)
      // Set empty array on error
      setTimers([])
    } finally {
      setLoadingTimers(false)
    }
  }, [])

  const saveTimer = useCallback(
    async (timer: TimerSpec) => {
      try {
        await TimerStorage.addTimer(timer)
        await refreshTimers() // Refresh the list
      } catch (error) {
        console.error("Error saving timer:", error)
        throw error
      }
    },
    [refreshTimers],
  )

  const updateTimer = useCallback(
    async (id: string, timer: TimerSpec) => {
      try {
        await TimerStorage.updateTimer(id, timer)
        await refreshTimers() // Refresh the list
      } catch (error) {
        console.error("Error updating timer:", error)
        throw error
      }
    },
    [refreshTimers],
  )

  const deleteTimer = useCallback(
    async (id: string) => {
      try {
        await TimerStorage.deleteTimer(id)
        await refreshTimers() // Refresh the list
      } catch (error) {
        console.error("Error deleting timer:", error)
        throw error
      }
    },
    [refreshTimers],
  )

  const getTimer = useCallback(
    (id: string): TimerSpec | undefined => {
      return timers.find((t) => t.id === id)
    },
    [timers],
  )

  // Load timers and initialize notifications on app start
  useEffect(() => {
    const initializeApp = async () => {
      await refreshTimers()
      const status = await NotificationService.registerForPushNotifications()
      if (status !== "granted" && Device.isDevice) {
        Alert.alert(
          "Notifications Disabled",
          "Enable notifications in Settings to receive interval alerts when the app is in the background.",
        )
      }
    }
    initializeApp()
  }, [refreshTimers])

  // Configure audio mode so sounds play in silent mode and background
  useEffect(() => {
    ;(async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "duckOthers",
          shouldRouteThroughEarpiece: false,
        })
      } catch (e) {
        console.warn("Failed to set audio mode", e)
      }
    })()
  }, [])

  // Removed unused segment-level notification helpers

  // (Deprecated) scheduleCompletionNotification removed in favor of scheduling all boundaries

  // Schedule notifications for each remaining segment boundary (work/rest) plus completion
  const scheduleAllRemainingSegmentNotifications = useCallback(async () => {
    const spec = currentTimer.current
    if (!spec) return
    const s = latestState.current
    if (!(s.kind === "running" || s.kind === "paused")) return
    const entries: { title: string; body: string; seconds: number }[] = []
    // build boundaries for remaining segments
    let offset = s.remaining // time until current segment ends
    let segIdx = s.segmentIndex
    let round = s.round
    // Helper to push entry for current boundary
    function push(boundLabel: string, secs: number) {
      if (!spec) return
      entries.push({
        title: spec.name,
        body: boundLabel,
        seconds: Math.max(1, Math.floor(secs)),
      })
    }
    // Remaining segments in current round after current
    while (round <= spec.rounds) {
      // current segment end
      const segLabel = spec.segments[segIdx]?.label || "Interval"
      push(`${segLabel} complete`, offset)
      // advance
      segIdx++
      if (segIdx >= spec.segments.length) {
        round++
        if (round > spec.rounds) break
        segIdx = 0
      }
      if (round > spec.rounds) break
      // Add next segment duration to offset for following boundary
      if (segIdx < spec.segments.length) {
        offset += spec.segments[segIdx].seconds
      }
    }
    // Replace last boundary message with final completion
    if (entries.length) entries[entries.length - 1].body = "Timer finished"
    await NotificationService.cancelAllNotifications()
    await NotificationService.scheduleMultiple(entries)
  }, [])

  // App state listener for background/foreground detection
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        const wasActive = appState.current === "active"
        const isNowActive = nextAppState === "active"
        const goingToBackground = wasActive && !isNowActive
        const comingToForeground = !wasActive && isNowActive

        appState.current = nextAppState

        if (goingToBackground) {
          const isTimingActive =
            latestState.current.kind === "running" ||
            latestState.current.kind === "countdown"
          if (isTimingActive) {
            engine.beginBackgroundTracking()
          }
          backgroundAt.current = isTimingActive ? Date.now() : null
          await NotificationService.cancelAllNotifications()
          await scheduleAllRemainingSegmentNotifications()
        } else if (comingToForeground) {
          const elapsedViaTicks = engine.endBackgroundTracking()
          await NotificationService.cancelAllNotifications()
          const isTimingActive =
            latestState.current.kind === "running" ||
            latestState.current.kind === "countdown"
          if (backgroundAt.current && currentTimer.current && isTimingActive) {
            const totalElapsed = Date.now() - backgroundAt.current
            const elapsed = Math.max(0, totalElapsed - elapsedViaTicks)
            backgroundAt.current = null
            engine.fastForward(elapsed)
            engine.rebaseTickerClock()
          }
        }
      },
    )
    return () => subscription.remove()
  }, [scheduleAllRemainingSegmentNotifications, engine])

  // Track previous state to detect segment transitions
  const prevState = useRef<EngineState>({ kind: "idle" })

  React.useEffect(() => {
    const unsubscribe = engine.subscribe(async (s) => {
      const prev = prevState.current
      setState(s)
      latestState.current = s

      // Play beep_1 when timer starts (countdown -> running)
      if (
        s.kind === "running" &&
        prev.kind === "countdown" &&
        currentTimer.current &&
        settings.soundsEnabled
      ) {
        await play("beep_1")
      }

      // Segment transition (running -> running with different segmentIndex)
      if (
        s.kind === "running" &&
        prev.kind === "running" &&
        currentTimer.current &&
        prev.segmentIndex !== s.segmentIndex &&
        settings.soundsEnabled
      ) {
        const spec = currentTimer.current
        await play("beep_1")
        if (
          settings.hapticsEnabled &&
          spec.options?.haptics &&
          spec.options.haptics !== "off"
        ) {
          const pattern =
            spec.options.haptics === "strong"
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Light
          await Haptics.impactAsync(pattern)
        }
      }

      // Play beep_2 at 3, 2, and 1 seconds remaining during initial countdown
      if (
        s.kind === "countdown" &&
        currentTimer.current &&
        settings.countdownBeepsEnabled &&
        settings.soundsEnabled
      ) {
        // Play beep when countdown shows 3 (either first time or transition to 3)
        if (
          (prev.kind !== "countdown" && s.remaining <= 3) ||
          (prev.kind === "countdown" && prev.remaining > 3 && s.remaining <= 3)
        ) {
          await play("beep_2")
        }
        // Play beep when countdown shows 2
        if (
          prev.kind === "countdown" &&
          prev.remaining > 2 &&
          s.remaining <= 2
        ) {
          await play("beep_2")
        }
        // Play beep when countdown shows 1
        if (
          prev.kind === "countdown" &&
          prev.remaining > 1 &&
          s.remaining <= 1
        ) {
          await play("beep_2")
        }
      }

      // Play beep_2 at 3, 2, and 1 seconds remaining in any segment
      if (
        s.kind === "running" &&
        prev.kind === "running" &&
        currentTimer.current &&
        settings.countdownBeepsEnabled &&
        settings.soundsEnabled
      ) {
        // 3 seconds remaining
        if (prev.remaining > 3 && s.remaining <= 3) {
          await play("beep_2")
        }
        // 2 seconds remaining
        if (prev.remaining > 2 && s.remaining <= 2) {
          await play("beep_2")
        }
        // 1 second remaining
        if (prev.remaining > 1 && s.remaining <= 1) {
          await play("beep_2")
        }
      }

      if (s.kind === "finished" && currentTimer.current?.options?.endSound) {
        if (settings.soundsEnabled) {
          await play(currentTimer.current.options.endSound)
        }
        if (settings.hapticsEnabled) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          )
        }
        await NotificationService.cancelAllNotifications()

        // Stop all sounds after a short delay to let completion sound play
        setTimeout(async () => {
          await stopAllSounds()
        }, 3000) // Stop after 3 seconds
      }

      prevState.current = s
    })
    return () => {
      unsubscribe() // ensure void return
    }
  }, [engine, play, stopAllSounds, settings])

  const loadTimer = useCallback(
    (t: TimerSpec) => {
      currentTimer.current = t
      engine.load(t)
      AsyncStorage.setItem(LAST_TIMER_KEY, t.id).catch(() => {})
    },
    [engine],
  )

  const start = useCallback(() => {
    engine.start()
  }, [engine])

  const startLastOrFirst = useCallback(async () => {
    try {
      // if a timer already loaded do nothing
      if (currentTimer.current) {
        start()
        return
      }
      let availableTimers = timers
      // load timers list directly if empty to avoid stale closure usage
      if (!availableTimers.length) {
        availableTimers = await TimerStorage.getTimers()
        setTimers(availableTimers)
      }
      let id: string | null = null
      try {
        id = await AsyncStorage.getItem(LAST_TIMER_KEY)
      } catch {}
      let timerToUse: TimerSpec | undefined
      if (id) {
        timerToUse = availableTimers.find((t) => t.id === id)
      }
      if (!timerToUse) {
        timerToUse = availableTimers[0]
      }
      if (timerToUse) {
        loadTimer(timerToUse)
        start()
      }
    } catch (e) {
      console.warn("Failed to start last or first timer", e)
    }
  }, [timers, loadTimer, start])

  const pause = async () => {
    await NotificationService.cancelAllNotifications()
    await stopAllSounds() // Stop any playing sounds when pausing
    engine.pause()
  }

  const resume = () => {
    engine.resume()
    // Notification rescheduling is handled by AppState listener
  }

  const restart = async () => {
    await NotificationService.cancelAllNotifications()
    await stopAllSounds() // Stop any playing sounds when restarting
    engine.restart()
    // Notification scheduling is handled by AppState listener
  }

  return (
    <TimerCtx.Provider
      value={{
        engine,
        state,
        loadTimer,
        startLastOrFirst,
        start,
        pause,
        resume,
        restart,
        timers,
        loadingTimers,
        refreshTimers,
        saveTimer,
        updateTimer,
        deleteTimer,
        getTimer,
      }}
    >
      {children}
    </TimerCtx.Provider>
  )
}
