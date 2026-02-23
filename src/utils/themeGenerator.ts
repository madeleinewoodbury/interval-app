import { TimerSpec } from "../types"
import { COLORS } from "../constants/colors"

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
  const r = Math.max(
    0,
    Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - percent)),
  )
  const g = Math.max(
    0,
    Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - percent)),
  )
  const b = Math.max(
    0,
    Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - percent)),
  )

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

// Helper function to lighten a color
function lightenColor(hexColor: string, percent: number): string {
  const hex = hexColor.replace("#", "")
  const r = Math.min(
    255,
    Math.floor(
      parseInt(hex.substr(0, 2), 16) +
        (255 - parseInt(hex.substr(0, 2), 16)) * percent,
    ),
  )
  const g = Math.min(
    255,
    Math.floor(
      parseInt(hex.substr(2, 2), 16) +
        (255 - parseInt(hex.substr(2, 2), 16)) * percent,
    ),
  )
  const b = Math.min(
    255,
    Math.floor(
      parseInt(hex.substr(4, 2), 16) +
        (255 - parseInt(hex.substr(4, 2), 16)) * percent,
    ),
  )

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

// Generate theme from timer specification
export function generateThemeFromTimer(timerSpec: TimerSpec): TimerTheme {
  const workSegment = timerSpec.segments.find((s) => s.id === "work")
  const restSegment = timerSpec.segments.find((s) => s.id === "rest")

  const workColor = workSegment?.color || COLORS.orange600
  const restColor = restSegment?.color || COLORS.navy900

  // Generate UI colors based on work color (primary segment)
  const uiBackground = darkenColor(workColor, 0.85) // Very dark version
  const cardBackground = darkenColor(workColor, 0.75) // Lighter than bg
  const accent = restColor // Use rest color as accent

  return {
    work: {
      background: workColor,
      text: isLightColor(workColor) ? COLORS.charcoal900 : COLORS.white,
      textSecondary: isLightColor(workColor)
        ? COLORS.transparentCharcoal70
        : COLORS.transparentWhite80,
    },
    rest: {
      background: restColor,
      text: isLightColor(restColor) ? COLORS.charcoal900 : COLORS.white,
      textSecondary: isLightColor(restColor)
        ? COLORS.transparentCharcoal70
        : COLORS.transparentWhite80,
    },
    ui: {
      background: uiBackground,
      cardBackground: cardBackground,
      accent: accent,
      textPrimary: COLORS.white,
      textSecondary: COLORS.transparentWhite70,
      buttonPrimary: accent,
      buttonSecondary: lightenColor(uiBackground, 0.2),
      success: COLORS.green500,
    },
    states: {
      countdown: darkenColor(workColor, 0.6),
      finished: COLORS.emerald600,
      paused: darkenColor(workColor, 0.7),
    },
  }
}

// Default neutral theme for non-timer screens
export const neutralTheme: TimerTheme = {
  work: {
    background: COLORS.gray700,
    text: COLORS.white,
    textSecondary: COLORS.transparentWhite80,
  },
  rest: {
    background: COLORS.gray700,
    text: COLORS.white,
    textSecondary: COLORS.transparentWhite80,
  },
  ui: {
    background: COLORS.slate900,
    cardBackground: COLORS.slate800,
    accent: COLORS.blue500,
    textPrimary: COLORS.white,
    textSecondary: COLORS.slate400,
    buttonPrimary: COLORS.blue500,
    buttonSecondary: COLORS.slate600,
    success: COLORS.green500,
  },
  states: {
    countdown: COLORS.gray700,
    finished: COLORS.emerald600,
    paused: COLORS.gray500,
  },
}

export const neutralLightTheme: TimerTheme = {
  work: {
    background: COLORS.white,
    text: COLORS.slate900,
    textSecondary: COLORS.slate600,
  },
  rest: {
    background: COLORS.white,
    text: COLORS.slate900,
    textSecondary: COLORS.slate600,
  },
  ui: {
    background: COLORS.slate50,
    cardBackground: COLORS.white,
    accent: COLORS.blue600,
    textPrimary: COLORS.slate900,
    textSecondary: COLORS.slate600,
    buttonPrimary: COLORS.blue600,
    buttonSecondary: COLORS.slate200,
    success: COLORS.green600,
  },
  states: {
    countdown: COLORS.slate200,
    finished: COLORS.green600,
    paused: COLORS.slate400,
  },
}

export function chooseNeutralTheme(mode: "light" | "dark") {
  return mode === "light" ? neutralLightTheme : neutralTheme
}
