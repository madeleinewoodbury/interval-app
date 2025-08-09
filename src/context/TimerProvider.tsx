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
import { Audio, AVPlaybackSource } from "expo-av"
import { TimerEngine } from "../engine/timerEngine"
import { EngineState, TimerSpec } from "../types"
import { TimerStorage } from "../services/TimerStorage"
import { NotificationService } from "../services/NotificationService"

type Ctx = {
  // Timer engine
  engine: TimerEngine
  state: EngineState
  loadTimer: (t: TimerSpec) => void
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

const soundMap: Record<string, AVPlaybackSource> = {
  beep_1: require("../../assets/sounds/beep_1.mp3"),
  beep_2: require("../../assets/sounds/beep_2.mp3"),
  completed: require("../../assets/sounds/completed.mp3"),
}

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useKeepAwake()
  const engine = useMemo(() => new TimerEngine(), [])
  const [state, setState] = useState<EngineState>({ kind: "idle" })
  const currentTimer = useRef<TimerSpec | null>(null)

  // Timer management state
  const [timers, setTimers] = useState<TimerSpec[]>([])
  const [loadingTimers, setLoadingTimers] = useState(true)

  // App state management
  const appState = useRef(AppState.currentState)
  const [isInBackground, setIsInBackground] = useState(false)

  // preload sounds on first use
  const soundCache = useRef<Record<string, Audio.Sound | null>>({})

  const play = useCallback(async (key?: string) => {
    if (!key) return
    try {
      // Always recreate the sound to avoid seeking issues
      if (soundCache.current[key]) {
        try {
          await soundCache.current[key]?.unloadAsync()
        } catch {
          // Ignore unload errors
        }
      }

      // Create fresh sound instance
      const snd = new Audio.Sound()
      await snd.loadAsync(soundMap[key])
      soundCache.current[key] = snd

      // Play the fresh sound
      await snd.playAsync()
    } catch (error) {
      console.error(`Error playing sound ${key}:`, error)
    }
  }, [])

  const stopAllSounds = useCallback(async () => {
    try {
      const soundPromises = Object.values(soundCache.current).map(
        async (sound) => {
          if (sound) {
            try {
              const status = await sound.getStatusAsync()
              // Only stop if it's loaded and playing
              if (status.isLoaded && status.isPlaying) {
                await sound.stopAsync()
              }
            } catch (stopError) {
              // Ignore individual sound stop errors
              console.warn("Could not stop individual sound:", stopError)
            }
          }
        },
      )
      await Promise.all(soundPromises)
      console.log("Stopped all sounds")
    } catch (error) {
      console.error("Error stopping sounds:", error)
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
  }, [])

  // App state listener for background/foreground detection
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const wasActive = appState.current === "active"
      const isNowActive = nextAppState === "active"
      const goingToBackground = wasActive && !isNowActive
      const comingToForeground = !wasActive && isNowActive

      appState.current = nextAppState
      setIsInBackground(nextAppState !== "active")

      if (
        goingToBackground &&
        (state.kind === "running" || state.kind === "countdown")
      ) {
        // App going to background with active timer - schedule next notification
        scheduleNextSegmentNotification()
      } else if (comingToForeground) {
        // App coming to foreground - cancel any pending notifications
        NotificationService.cancelAllNotifications()
      }
    })

    return () => subscription?.remove()
  }, [state])

  // Helper function to calculate next notification details
  const getNextNotificationInfo = useCallback(() => {
    if (!currentTimer.current) return null

    if (state.kind === "countdown") {
      return {
        title: currentTimer.current.name,
        body: "Timer starting now!",
        seconds: state.remaining,
      }
    }

    if (state.kind === "running") {
      const currentSegment =
        currentTimer.current.segments[state.segmentIndex || 0]
      const remainingTime = state.remaining || 0

      return {
        title: currentTimer.current.name,
        body: `Round ${state.round}/${currentTimer.current.rounds} - ${currentSegment?.label || "Interval"} ending`,
        seconds: remainingTime,
      }
    }

    return null
  }, [state, currentTimer])

  // Schedule notification for next segment transition
  const scheduleNextSegmentNotification = useCallback(async () => {
    const notificationInfo = getNextNotificationInfo()
    if (notificationInfo && isInBackground) {
      await NotificationService.scheduleNextNotification(
        notificationInfo.title,
        notificationInfo.body,
        notificationInfo.seconds,
      )
    }
  }, [getNextNotificationInfo, isInBackground])

  // Track previous state to detect segment transitions
  const prevState = useRef<EngineState>({ kind: "idle" })

  React.useEffect(() => {
    const unsubscribe = engine.subscribe(async (s) => {
      const prev = prevState.current
      setState(s)

      // Play beep_1 when timer starts (countdown to running transition)
      if (
        s.kind === "running" &&
        prev.kind === "countdown" &&
        currentTimer.current
      ) {
        await play("beep_1")
      }

      // Play beep_1 on segment transitions (end of intervals)
      if (
        s.kind === "running" &&
        prev.kind === "running" &&
        currentTimer.current
      ) {
        const spec = currentTimer.current

        // Check if we transitioned to a different segment
        if (prev.segmentIndex !== s.segmentIndex) {
          await play("beep_1")

          if (spec.options?.haptics && spec.options.haptics !== "off") {
            const pattern =
              spec.options.haptics === "strong"
                ? Haptics.ImpactFeedbackStyle.Heavy
                : Haptics.ImpactFeedbackStyle.Light
            await Haptics.impactAsync(pattern)
          }

          // Schedule next notification if app is in background
          if (isInBackground) {
            scheduleNextSegmentNotification()
          }
        }
      }

      // Play beep_2 at 3, 2, and 1 seconds remaining during initial countdown
      if (s.kind === "countdown" && currentTimer.current) {
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
        currentTimer.current
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
        await play(currentTimer.current.options.endSound)
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        )
        // Clean up notifications when timer finishes
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
  }, [
    engine,
    play,
    isInBackground,
    scheduleNextSegmentNotification,
    stopAllSounds,
  ])

  function loadTimer(t: TimerSpec) {
    currentTimer.current = t
    engine.load(t)
  }

  const start = () => {
    engine.start()
    // Notification scheduling is handled by AppState listener
  }

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
