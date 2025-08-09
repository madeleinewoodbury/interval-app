import { Tabs } from "expo-router"
import { TimerProvider } from "../src/context/TimerProvider"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AntDesign } from "@expo/vector-icons"

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TimerProvider>
        <Tabs screenOptions={{ headerTitleAlign: "center" }}>
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
        </Tabs>
      </TimerProvider>
    </GestureHandlerRootView>
  )
}
