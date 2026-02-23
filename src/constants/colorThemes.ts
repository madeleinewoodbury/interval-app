import { COLORS } from "./colors"

export type ColorThemeOption = {
  id: string
  name: string
  description: string
  workColor: string
  restColor: string
  preview: {
    workLabel: string
    restLabel: string
  }
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional red/blue combination",
    workColor: COLORS.red500, // Red
    restColor: COLORS.blue500, // Blue
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "nature",
    name: "Nature",
    description: "Fresh green and sky blue",
    workColor: COLORS.green500, // Green
    restColor: COLORS.sky500, // Sky blue
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange and purple",
    workColor: COLORS.orange500, // Orange
    restColor: COLORS.purple500, // Purple
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "energy",
    name: "Energy",
    description: "Bright yellow and teal",
    workColor: COLORS.yellow500, // Yellow
    restColor: COLORS.teal500, // Teal
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue and cyan waves",
    workColor: COLORS.blue900, // Deep blue
    restColor: COLORS.cyan500, // Cyan
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "fire",
    name: "Fire",
    description: "Intense red and pink flames",
    workColor: COLORS.red600, // Crimson
    restColor: COLORS.pink500, // Pink
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "earth",
    name: "Earth",
    description: "Brown earth and forest green",
    workColor: COLORS.brown700, // Brown
    restColor: COLORS.forest800, // Forest green
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark purple and indigo",
    workColor: COLORS.purple700, // Dark purple
    restColor: COLORS.indigo600, // Indigo
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
]

// Helper function to get theme by ID
export function getColorThemeById(id: string): ColorThemeOption | undefined {
  return COLOR_THEMES.find((theme) => theme.id === id)
}

// Helper function to create timer segments from color theme
export function createSegmentsFromTheme(
  theme: ColorThemeOption,
  workSeconds: number,
  restSeconds: number,
) {
  return [
    {
      id: "work",
      label: "Work",
      seconds: workSeconds,
      color: theme.workColor,
      sound: "beep_1" as const,
    },
    {
      id: "rest",
      label: "Rest",
      seconds: restSeconds,
      color: theme.restColor,
      sound: "beep_2" as const,
    },
  ]
}

// Default theme (Classic)
export const DEFAULT_COLOR_THEME = COLOR_THEMES[0]
