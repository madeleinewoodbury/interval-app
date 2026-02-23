import AsyncStorage from "@react-native-async-storage/async-storage"
import { TimerSpec } from "../types"
import { DEFAULT_COLOR_THEME } from "../constants/colorThemes"

const TIMERS_STORAGE_KEY = "@interval_app_timers"

// Default TABATA timer - will be included when app first loads
const DEFAULT_TABATA: TimerSpec = {
  id: "tabata-default",
  name: "Tabata 10/5 × 2",
  rounds: 2,
  segments: [
    {
      id: "work",
      label: "Work",
      seconds: 10,
      color: DEFAULT_COLOR_THEME.workColor,
      sound: "beep_1",
    },
    {
      id: "rest",
      label: "Rest",
      seconds: 5,
      color: DEFAULT_COLOR_THEME.restColor,
      sound: "beep_2",
    },
  ],
  options: {
    countdown: 3,
    endSound: "completed",
    haptics: "subtle",
    keepAwake: true,
  },
}

export class TimerStorage {
  // Get all saved timers
  static async getTimers(): Promise<TimerSpec[]> {
    try {
      const timersJson = await AsyncStorage.getItem(TIMERS_STORAGE_KEY)
      if (timersJson) {
        return JSON.parse(timersJson)
      } else {
        // First time loading - return empty array, no default timer
        return []
      }
    } catch (error) {
      console.error("Error loading timers:", error)
      return [] // Return empty array on error
    }
  }

  // Save all timers (private helper)
  private static async saveTimers(timers: TimerSpec[]): Promise<void> {
    try {
      const timersJson = JSON.stringify(timers)
      await AsyncStorage.setItem(TIMERS_STORAGE_KEY, timersJson)
    } catch (error) {
      console.error("Error saving timers:", error)
      throw error
    }
  }

  // Add a new timer
  static async addTimer(timer: TimerSpec): Promise<void> {
    try {
      const timers = await this.getTimers()

      // Generate unique ID if not provided
      if (!timer.id || timer.id === "") {
        timer.id = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Check if timer with same ID already exists
      const existingIndex = timers.findIndex((t) => t.id === timer.id)
      if (existingIndex !== -1) {
        throw new Error("Timer with this ID already exists")
      }

      timers.push(timer)
      await this.saveTimers(timers)
    } catch (error) {
      console.error("Error adding timer:", error)
      throw error
    }
  }

  // Update an existing timer
  static async updateTimer(
    timerId: string,
    updatedTimer: TimerSpec,
  ): Promise<void> {
    try {
      const timers = await this.getTimers()
      const timerIndex = timers.findIndex((t) => t.id === timerId)

      if (timerIndex === -1) {
        throw new Error("Timer not found")
      }

      // Ensure the ID remains the same
      updatedTimer.id = timerId
      timers[timerIndex] = updatedTimer
      await this.saveTimers(timers)
    } catch (error) {
      console.error("Error updating timer:", error)
      throw error
    }
  }

  // Delete a timer
  static async deleteTimer(timerId: string): Promise<void> {
    try {
      const timers = await this.getTimers()
      const filteredTimers = timers.filter((t) => t.id !== timerId)

      if (filteredTimers.length === timers.length) {
        throw new Error("Timer not found")
      }

      await this.saveTimers(filteredTimers)
    } catch (error) {
      console.error("Error deleting timer:", error)
      throw error
    }
  }

  // Get a specific timer by ID
  static async getTimer(timerId: string): Promise<TimerSpec | null> {
    try {
      const timers = await this.getTimers()
      return timers.find((t) => t.id === timerId) || null
    } catch (error) {
      console.error("Error getting timer:", error)
      return null
    }
  }

  // Clear all timers (mainly for development/testing)
  static async clearAllTimers(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TIMERS_STORAGE_KEY)
    } catch (error) {
      console.error("Error clearing timers:", error)
      throw error
    }
  }

  // Get the default TABATA timer (for fallback cases)
  static getDefaultTimer(): TimerSpec {
    return { ...DEFAULT_TABATA }
  }
}
