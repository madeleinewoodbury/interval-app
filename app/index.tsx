import { Pressable, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTimer } from "../src/context/TimerProvider"
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

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "#0B0B0F" }}>
      <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>
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
          backgroundColor: "#1F2937",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            {TABATA.name}
          </Text>
          <Text style={{ color: "#9CA3AF", marginTop: 4 }}>
            {TABATA.segments.map((s) => `${s.label} ${s.seconds}s`).join(" / ")}
          </Text>
        </View>
        <AntDesign name="right" size={20} color="#60A5FA" />
      </Pressable>

      {/* Add a “+ New Timer” later */}
    </View>
  )
}
