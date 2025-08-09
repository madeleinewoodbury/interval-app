export type Segment = {
  id: string
  label: string
  seconds: number
  color: string
  sound?: "beep_1" | "beep_2"
}

export type TimerSpec = {
  id: string
  name: string
  rounds: number
  segments: Segment[]
  options?: {
    countdown?: number // seconds before start
    endSound?: "completed"
    haptics?: "off" | "subtle" | "strong"
    keepAwake?: boolean
  }
}

export type EngineState =
  | { kind: "idle" }
  | { kind: "countdown"; remaining: number }
  | { kind: "running"; segmentIndex: number; round: number; remaining: number }
  | { kind: "paused"; segmentIndex: number; round: number; remaining: number }
  | { kind: "finished" }
