import React from "react"
import Svg, { Circle } from "react-native-svg"
import { View } from "react-native"

type Props = {
  size: number
  stroke: number
  progress: number
  color: string
  bg?: string
}

export default function ProgressRing({
  size,
  stroke,
  progress,
  color,
  bg = "rgba(255,255,255,0.15)",
}: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <View>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={bg}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - clamped)}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
    </View>
  )
}
