import { Tabs } from "expo-router"
import { TimerProvider } from "../src/context/TimerProvider"
import { SettingsProvider, useSettings } from "../src/context/SettingsProvider"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AntDesign } from "@expo/vector-icons"
import { useColorScheme } from "react-native"
import { chooseNeutralTheme } from "../src/utils/themeGenerator"

function AppTabs() {
  const { settings } = useSettings()
  const systemScheme = useColorScheme() || "light"
  const effectiveTheme =
    settings.themePreference === "system"
      ? systemScheme
      : settings.themePreference
  const theme = chooseNeutralTheme(
    effectiveTheme === "light" ? "light" : "dark",
  )

  return (
    <TimerProvider>
      <Tabs
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: theme.ui.cardBackground,
          },
          headerTintColor: theme.ui.textPrimary,
          headerTitleStyle: {
            color: theme.ui.textPrimary,
          },
          tabBarStyle: {
            backgroundColor: theme.ui.cardBackground,
            borderTopColor: theme.ui.buttonSecondary,
            paddingTop: 8,
            height: 90,
          },
          tabBarActiveTintColor: theme.ui.accent,
          tabBarInactiveTintColor: theme.ui.textSecondary,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Timers",
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="clock-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="run"
          options={{
            title: "Run",
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="play-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create-timer"
          options={{
            title: "Create Timer",
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="setting" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </TimerProvider>
  )
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <AppTabs />
      </SettingsProvider>
    </GestureHandlerRootView>
  )
}
