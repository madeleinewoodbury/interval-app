import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useTimer } from "../src/context/TimerProvider"
import { neutralTheme } from "../src/utils/themeGenerator"
import { TimerSpec } from "../src/types"
import { AntDesign } from "@expo/vector-icons"
import ColorThemePicker from "../src/components/ColorThemePicker"
import {
  COLOR_THEMES,
  ColorThemeOption,
  DEFAULT_COLOR_THEME,
  createSegmentsFromTheme,
} from "../src/constants/colorThemes"

export default function CreateTimerScreen() {
  const router = useRouter()
  const { id: editingTimerId } = useLocalSearchParams<{ id?: string }>()
  const { saveTimer, updateTimer, getTimer } = useTimer()
  const theme = neutralTheme

  // Form state
  const [name, setName] = useState("")
  const [workMinutes, setWorkMinutes] = useState("0")
  const [workSeconds, setWorkSeconds] = useState("20")
  const [restMinutes, setRestMinutes] = useState("0")
  const [restSeconds, setRestSeconds] = useState("10")
  const [rounds, setRounds] = useState("8")
  const [selectedTheme, setSelectedTheme] =
    useState<ColorThemeOption>(DEFAULT_COLOR_THEME)
  const [saving, setSaving] = useState(false)

  const isEditing = !!editingTimerId

  // Load existing timer data if editing
  useEffect(() => {
    if (isEditing && editingTimerId) {
      const existingTimer = getTimer(editingTimerId)
      if (existingTimer) {
        setName(existingTimer.name)

        const workSegment = existingTimer.segments.find((s) => s.id === "work")
        const restSegment = existingTimer.segments.find((s) => s.id === "rest")

        if (workSegment) {
          setWorkMinutes(Math.floor(workSegment.seconds / 60).toString())
          setWorkSeconds((workSegment.seconds % 60).toString())
        }

        if (restSegment) {
          setRestMinutes(Math.floor(restSegment.seconds / 60).toString())
          setRestSeconds((restSegment.seconds % 60).toString())
        }

        setRounds(existingTimer.rounds.toString())

        // Find matching color theme
        if (workSegment && restSegment) {
          const matchingTheme = COLOR_THEMES.find(
            (t) =>
              t.workColor === workSegment.color &&
              t.restColor === restSegment.color,
          )
          if (matchingTheme) {
            setSelectedTheme(matchingTheme)
          }
        }
      }
    }
  }, [isEditing, editingTimerId, getTimer])

  const handleSave = async () => {
    // Basic validation
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a timer name")
      return
    }

    const workTotal = parseInt(workMinutes) * 60 + parseInt(workSeconds)
    const restTotal = parseInt(restMinutes) * 60 + parseInt(restSeconds)
    const totalRounds = parseInt(rounds)

    if (workTotal <= 0) {
      Alert.alert("Error", "Work interval must be greater than 0 seconds")
      return
    }

    if (restTotal <= 0) {
      Alert.alert("Error", "Rest interval must be greater than 0 seconds")
      return
    }

    if (totalRounds <= 0) {
      Alert.alert("Error", "Rounds must be greater than 0")
      return
    }

    setSaving(true)

    try {
      const timerData: TimerSpec = {
        id: isEditing ? editingTimerId! : "", // Will be generated if empty
        name: name.trim(),
        rounds: totalRounds,
        segments: createSegmentsFromTheme(selectedTheme, workTotal, restTotal),
        options: {
          countdown: 3,
          endSound: "completed",
          haptics: "subtle",
          keepAwake: true,
        },
      }

      if (isEditing) {
        await updateTimer(editingTimerId!, timerData)
      } else {
        await saveTimer(timerData)
      }

      router.back()
    } catch (error) {
      console.error("Error saving timer:", error)
      Alert.alert("Error", "Failed to save timer. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.ui.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.ui.cardBackground,
          }}
        >
          <Pressable onPress={handleCancel}>
            <Text style={{ color: theme.ui.accent, fontSize: 16 }}>Cancel</Text>
          </Pressable>

          <Text
            style={{
              color: theme.ui.textPrimary,
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            {isEditing ? "Edit Timer" : "New Timer"}
          </Text>

          <Pressable onPress={handleSave} disabled={saving}>
            <Text
              style={{
                color: saving ? theme.ui.textSecondary : theme.ui.accent,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Timer Name */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: theme.ui.textPrimary,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Timer Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. HIIT Workout, Study Session"
              placeholderTextColor={theme.ui.textSecondary}
              style={{
                backgroundColor: theme.ui.cardBackground,
                color: theme.ui.textPrimary,
                padding: 12,
                borderRadius: 8,
                fontSize: 16,
              }}
            />
          </View>

          {/* Work Interval */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: theme.ui.textPrimary,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Work Interval
            </Text>
            <View
              style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.ui.textSecondary, marginBottom: 4 }}
                >
                  Minutes
                </Text>
                <TextInput
                  value={workMinutes}
                  onChangeText={setWorkMinutes}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.ui.textSecondary}
                  style={{
                    backgroundColor: theme.ui.cardBackground,
                    color: theme.ui.textPrimary,
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                    textAlign: "center",
                  }}
                />
              </View>
              <Text style={{ color: theme.ui.textSecondary, marginTop: 20 }}>
                :
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.ui.textSecondary, marginBottom: 4 }}
                >
                  Seconds
                </Text>
                <TextInput
                  value={workSeconds}
                  onChangeText={setWorkSeconds}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor={theme.ui.textSecondary}
                  style={{
                    backgroundColor: theme.ui.cardBackground,
                    color: theme.ui.textPrimary,
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                    textAlign: "center",
                  }}
                />
              </View>
            </View>
          </View>

          {/* Rest Interval */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: theme.ui.textPrimary,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Rest Interval
            </Text>
            <View
              style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.ui.textSecondary, marginBottom: 4 }}
                >
                  Minutes
                </Text>
                <TextInput
                  value={restMinutes}
                  onChangeText={setRestMinutes}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.ui.textSecondary}
                  style={{
                    backgroundColor: theme.ui.cardBackground,
                    color: theme.ui.textPrimary,
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                    textAlign: "center",
                  }}
                />
              </View>
              <Text style={{ color: theme.ui.textSecondary, marginTop: 20 }}>
                :
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.ui.textSecondary, marginBottom: 4 }}
                >
                  Seconds
                </Text>
                <TextInput
                  value={restSeconds}
                  onChangeText={setRestSeconds}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={theme.ui.textSecondary}
                  style={{
                    backgroundColor: theme.ui.cardBackground,
                    color: theme.ui.textPrimary,
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                    textAlign: "center",
                  }}
                />
              </View>
            </View>
          </View>

          {/* Rounds */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: theme.ui.textPrimary,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Number of Rounds
            </Text>
            <TextInput
              value={rounds}
              onChangeText={setRounds}
              keyboardType="numeric"
              placeholder="8"
              placeholderTextColor={theme.ui.textSecondary}
              style={{
                backgroundColor: theme.ui.cardBackground,
                color: theme.ui.textPrimary,
                padding: 12,
                borderRadius: 8,
                fontSize: 16,
                width: 100,
                textAlign: "center",
              }}
            />
          </View>

          {/* Color Theme Picker */}
          <ColorThemePicker
            selectedThemeId={selectedTheme.id}
            onThemeSelect={setSelectedTheme}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
