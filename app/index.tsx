import { Pressable, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTimer } from "../src/context/TimerProvider"
import { neutralTheme } from "../src/utils/themeGenerator"
import { TimerSpec } from "../src/types"
import { AntDesign } from "@expo/vector-icons"

const TABATA: TimerSpec = {
  id: "tabata",
  name: "Tabata 10/5 × 2",
  rounds: 2,
  segments: [
    {
      id: "work",
      label: "Work",
      seconds: 10,
      color: "#EF4444",
      sound: "beep_1",
    },
    {
      id: "rest",
      label: "Rest",
      seconds: 5,
      color: "#3B82F6",
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

export default function TimersScreen() {
  const { loadTimer } = useTimer()
  const router = useRouter()

  // Use neutral theme for index screen
  const theme = neutralTheme

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        gap: 12,
        backgroundColor: theme.ui.background,
      }}
    >
      <Text
        style={{ color: theme.ui.textPrimary, fontSize: 24, fontWeight: "700" }}
      >
        Timers
      </Text>

      <Pressable
        onPress={() => {
          loadTimer(TABATA)
          router.push("/run")
        }}
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: theme.ui.cardBackground,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderLeftWidth: 4,
          borderLeftColor: TABATA.segments[0]?.color || theme.ui.accent,
        }}
      >
        <View>
          <Text
            style={{
              color: theme.ui.textPrimary,
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            {TABATA.name}
          </Text>
          <Text style={{ color: theme.ui.textSecondary, marginTop: 4 }}>
            {TABATA.segments.map((s) => `${s.label} ${s.seconds}s`).join(" / ")}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 6, gap: 8 }}>
            {TABATA.segments.map((segment) => (
              <View
                key={segment.id}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: segment.color,
                }}
              />
            ))}
          </View>
        </View>
        <AntDesign name="right" size={20} color={theme.ui.accent} />
      </Pressable>

      {/* Add a "+ New Timer" later */}
    </View>
  )
}
