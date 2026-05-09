import { Tabs } from "expo-router"
import { TimerProvider, useTimer } from "../src/context/TimerProvider"
import { SettingsProvider, useSettings } from "../src/context/SettingsProvider"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AntDesign } from "@expo/vector-icons"
import { useColorScheme } from "react-native"
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context"
import { chooseNeutralTheme } from "../src/utils/themeGenerator"

function AppTabs() {
  return (
    <TimerProvider>
      <TabsRouter />
    </TimerProvider>
  )
}

function TabsRouter() {
  const { settings } = useSettings()
  const { timers, loadingTimers } = useTimer()
  const systemScheme = useColorScheme() || "light"
  const insets = useSafeAreaInsets()
  const effectiveTheme =
    settings.themePreference === "system"
      ? systemScheme
      : settings.themePreference
  const theme = chooseNeutralTheme(
    effectiveTheme === "light" ? "light" : "dark",
  )
  const hideRunTab = !loadingTimers && timers.length === 0

  return (
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
          paddingBottom: insets.bottom,
          height: 56 + insets.bottom,
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
          tabBarAccessibilityLabel: "Timers tab",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="clock-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="run"
        options={{
          title: "Run",
          tabBarAccessibilityLabel: "Run tab",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="play-circle" size={size} color={color} />
          ),
          ...(hideRunTab && { href: null }),
        }}
      />
      <Tabs.Screen
        name="create-timer"
        options={{
          href: null, // Hide from tab bar
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarAccessibilityLabel: "Settings tab",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="setting" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AppTabs />
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
