import { TimerSpec } from "../types"

export type TimerTheme = {
  work: {
    background: string
    text: string
    textSecondary: string
  }
  rest: {
    background: string
    text: string
    textSecondary: string
  }
  ui: {
    background: string
    cardBackground: string
    accent: string
    textPrimary: string
    textSecondary: string
    buttonPrimary: string
    buttonSecondary: string
    success: string
  }
  states: {
    countdown: string
    finished: string
    paused: string
  }
}

// Helper function to determine if a color is light or dark
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)  
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate luminance using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

// Helper function to darken a color
function darkenColor(hexColor: string, percent: number): string {
  const hex = hexColor.replace("#", "")
  const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - percent)))
  const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - percent)))
  const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - percent)))
  
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

// Helper function to lighten a color
function lightenColor(hexColor: string, percent: number): string {
  const hex = hexColor.replace("#", "")
  const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) + (255 - parseInt(hex.substr(0, 2), 16)) * percent))
  const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) + (255 - parseInt(hex.substr(2, 2), 16)) * percent))
  const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) + (255 - parseInt(hex.substr(4, 2), 16)) * percent))
  
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

// Generate theme from timer specification
export function generateThemeFromTimer(timerSpec: TimerSpec): TimerTheme {
  const workSegment = timerSpec.segments.find(s => s.id === "work")
  const restSegment = timerSpec.segments.find(s => s.id === "rest")
  
  const workColor = workSegment?.color || "#FF6B35"
  const restColor = restSegment?.color || "#1B4F72"
  
  // Generate UI colors based on work color (primary segment)
  const uiBackground = darkenColor(workColor, 0.85) // Very dark version
  const cardBackground = darkenColor(workColor, 0.75) // Lighter than bg
  const accent = restColor // Use rest color as accent
  
  return {
    work: {
      background: workColor,
      text: isLightColor(workColor) ? "#1A202C" : "#FFFFFF",
      textSecondary: isLightColor(workColor) 
        ? "rgba(26, 32, 44, 0.7)" 
        : "rgba(255, 255, 255, 0.8)",
    },
    rest: {
      background: restColor,
      text: isLightColor(restColor) ? "#1A202C" : "#FFFFFF", 
      textSecondary: isLightColor(restColor)
        ? "rgba(26, 32, 44, 0.7)"
        : "rgba(255, 255, 255, 0.8)",
    },
    ui: {
      background: uiBackground,
      cardBackground: cardBackground,
      accent: accent,
      textPrimary: "#FFFFFF",
      textSecondary: "rgba(255, 255, 255, 0.7)",
      buttonPrimary: accent,
      buttonSecondary: lightenColor(uiBackground, 0.2),
      success: "#22C55E",
    },
    states: {
      countdown: darkenColor(workColor, 0.6),
      finished: "#059669",
      paused: darkenColor(workColor, 0.7),
    },
  }
}

// Default neutral theme for non-timer screens
export const neutralTheme: TimerTheme = {
  work: {
    background: "#374151",
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.8)",
  },
  rest: {
    background: "#374151", 
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.8)",
  },
  ui: {
    background: "#0F172A",
    cardBackground: "#1E293B",
    accent: "#3B82F6", 
    textPrimary: "#FFFFFF",
    textSecondary: "#94A3B8",
    buttonPrimary: "#3B82F6",
    buttonSecondary: "#475569", 
    success: "#22C55E",
  },
  states: {
    countdown: "#374151",
    finished: "#059669",
    paused: "#6B7280",
  },
}