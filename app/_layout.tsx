import { Tabs } from "expo-router"
import { TimerProvider } from "../src/context/TimerProvider"
import { SettingsProvider } from "../src/context/SettingsProvider"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AntDesign } from "@expo/vector-icons"
import { useColorScheme } from "react-native"

export default function Layout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <TimerProvider>
          <Tabs
            screenOptions={{
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: isDark ? "#000000" : "#FFFFFF",
              },
              headerTintColor: isDark ? "#FFFFFF" : "#000000",
              tabBarStyle: {
                backgroundColor: isDark ? "#000000" : "#FFFFFF",
                borderTopColor: isDark ? "#333333" : "#E5E5E5",
                paddingTop: 8,
                height: 90,
              },
              tabBarActiveTintColor: isDark ? "#007AFF" : "#007AFF", // iOS system blue
              tabBarInactiveTintColor: isDark ? "#8E8E93" : "#8E8E93", // iOS system gray
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
                  <AntDesign name="clockcircleo" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="run"
              options={{
                title: "Run",
                tabBarIcon: ({ color, size }) => (
                  <AntDesign name="play" size={size} color={color} />
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
      </SettingsProvider>
    </GestureHandlerRootView>
  )
}
