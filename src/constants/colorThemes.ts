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
    workColor: "#EF4444", // Red
    restColor: "#3B82F6", // Blue
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "nature",
    name: "Nature",
    description: "Fresh green and sky blue",
    workColor: "#22C55E", // Green
    restColor: "#0EA5E9", // Sky blue
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange and purple",
    workColor: "#F97316", // Orange
    restColor: "#8B5CF6", // Purple
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "energy",
    name: "Energy",
    description: "Bright yellow and teal",
    workColor: "#EAB308", // Yellow
    restColor: "#14B8A6", // Teal
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue and cyan waves",
    workColor: "#1E40AF", // Deep blue
    restColor: "#06B6D4", // Cyan
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "fire",
    name: "Fire",
    description: "Intense red and pink flames",
    workColor: "#DC2626", // Crimson
    restColor: "#EC4899", // Pink
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "earth",
    name: "Earth",
    description: "Brown earth and forest green",
    workColor: "#92400E", // Brown
    restColor: "#166534", // Forest green
    preview: {
      workLabel: "Work",
      restLabel: "Rest",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark purple and indigo",
    workColor: "#7C2D92", // Dark purple
    restColor: "#4338CA", // Indigo
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
