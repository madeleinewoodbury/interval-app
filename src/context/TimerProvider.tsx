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
import * as Haptics from "expo-haptics"
import { Audio, AVPlaybackSource } from "expo-av"
import { TimerEngine } from "../engine/timerEngine"
import { EngineState, TimerSpec } from "../types"
import { TimerStorage } from "../services/TimerStorage"

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

  // preload sounds on first use
  const soundCache = useRef<Record<string, Audio.Sound | null>>({})

  const play = useCallback(async (key?: string) => {
    if (!key) return
    if (!soundCache.current[key]) {
      const snd = new Audio.Sound()
      await snd.loadAsync(soundMap[key])
      soundCache.current[key] = snd
    }
    await soundCache.current[key]?.replayAsync()
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

  // Load timers on app start
  useEffect(() => {
    refreshTimers()
  }, [])

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
      }

      prevState.current = s
    })
    return () => {
      unsubscribe() // ensure void return
    }
  }, [engine, play])

  function loadTimer(t: TimerSpec) {
    currentTimer.current = t
    engine.load(t)
  }
  const start = () => engine.start()
  const pause = () => engine.pause()
  const resume = () => engine.resume()
  const restart = () => engine.restart()

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
