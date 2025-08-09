import React from "react"
import { View, Text, Pressable, ScrollView } from "react-native"
import { COLOR_THEMES, ColorThemeOption } from "../constants/colorThemes"
import { neutralTheme } from "../utils/themeGenerator"

type Props = {
  selectedThemeId?: string
  onThemeSelect: (theme: ColorThemeOption) => void
}

export default function ColorThemePicker({ selectedThemeId, onThemeSelect }: Props) {
  const theme = neutralTheme

  return (
    <View style={{ marginVertical: 16 }}>
      <Text
        style={{
          color: theme.ui.textPrimary,
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 12,
        }}
      >
        Color Theme
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
      >
        {COLOR_THEMES.map((colorTheme) => {
          const isSelected = selectedThemeId === colorTheme.id
          
          return (
            <Pressable
              key={colorTheme.id}
              onPress={() => onThemeSelect(colorTheme)}
              style={{
                width: 120,
                borderRadius: 12,
                padding: 12,
                backgroundColor: isSelected 
                  ? theme.ui.accent + "20" // Add transparency
                  : theme.ui.cardBackground,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected 
                  ? theme.ui.accent 
                  : theme.ui.cardBackground,
              }}
            >
              {/* Color preview */}
              <View style={{ 
                flexDirection: "row", 
                marginBottom: 8,
                gap: 4,
                justifyContent: "center",
              }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: colorTheme.workColor,
                  }}
                />
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: colorTheme.restColor,
                  }}
                />
              </View>
              
              {/* Theme name */}
              <Text
                style={{
                  color: theme.ui.textPrimary,
                  fontSize: 14,
                  fontWeight: "600",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {colorTheme.name}
              </Text>
              
              {/* Theme description */}
              <Text
                style={{
                  color: theme.ui.textSecondary,
                  fontSize: 11,
                  textAlign: "center",
                  lineHeight: 14,
                }}
                numberOfLines={2}
              >
                {colorTheme.description}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
      
      {selectedThemeId && (
        <View style={{ 
          marginTop: 12, 
          padding: 12, 
          backgroundColor: theme.ui.cardBackground,
          borderRadius: 8,
        }}>
          <Text
            style={{
              color: theme.ui.textSecondary,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Work intervals will use{" "}
            <Text style={{ fontWeight: "600" }}>
              {COLOR_THEMES.find(t => t.id === selectedThemeId)?.name}
            </Text>{" "}
            colors
          </Text>
        </View>
      )}
    </View>
  )
}