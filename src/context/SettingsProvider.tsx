import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export type AppSettings = {
  soundsEnabled: boolean
  hapticsEnabled: boolean
  countdownBeepsEnabled: boolean
  themePreference: "system" | "light" | "dark"
}

const DEFAULT_SETTINGS: AppSettings = {
  soundsEnabled: true,
  hapticsEnabled: true,
  countdownBeepsEnabled: true,
  themePreference: "system",
}

const STORAGE_KEY = "app_settings_v1"

type SettingsCtx = {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

const Ctx = createContext<SettingsCtx | null>(null)
export const useSettings = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error("SettingsProvider missing")
  return v
}

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch (e) {
    console.warn("Failed loading settings", e)
    return DEFAULT_SETTINGS
  }
}

async function persist(settings: AppSettings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn("Failed saving settings", e)
  }
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s)
      setLoaded(true)
    })
  }, [])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      persist(next)
      return next
    })
  }, [])

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS)
    await persist(DEFAULT_SETTINGS)
  }, [])

  if (!loaded) return null // could render splash or nothing

  return (
    <Ctx.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </Ctx.Provider>
  )
}
