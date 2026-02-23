import { TimerSpec } from "../types"

type Listener = (s: import("../types").EngineState) => void

export class TimerEngine {
  private spec: TimerSpec | null = null
  private listeners = new Set<Listener>()
  private ticker?: ReturnType<typeof setInterval>
  private lastTickAt: number | null = null
  private backgrounded = false
  private backgroundElapsedMs = 0
  private state: import("../types").EngineState = { kind: "idle" }
  private segIdx = 0
  private round = 1
  private remaining = 0

  rebaseTickerClock() {
    this.lastTickAt = Date.now()
  }

  beginBackgroundTracking() {
    this.backgrounded = true
    this.backgroundElapsedMs = 0
    this.rebaseTickerClock()
  }

  endBackgroundTracking(): number {
    const elapsedMs = this.backgroundElapsedMs
    this.backgrounded = false
    this.backgroundElapsedMs = 0
    this.rebaseTickerClock()
    return elapsedMs
  }

  /**
   * Fast-forward the engine by a given elapsed milliseconds that occurred while app was backgrounded.
   * This simulates ticks so that segment / round transitions are honored.
   */
  fastForward(elapsedMs: number) {
    if (!this.spec) return
    if (elapsedMs <= 0) return
    let remainingSeconds = elapsedMs / 1000
    // Handle countdown phase
    if (this.state.kind === "countdown") {
      if (remainingSeconds >= this.remaining) {
        remainingSeconds -= this.remaining
        // move to first segment
        this.beginFirst()
      } else {
        this.remaining -= remainingSeconds
        this.state = { kind: "countdown", remaining: Math.ceil(this.remaining) }
        this.emit()
        return
      }
    }
    // If not running, nothing else to do
    if (this.state.kind !== "running") return
    while (remainingSeconds > 0 && this.state.kind === "running") {
      if (remainingSeconds >= this.remaining) {
        remainingSeconds -= this.remaining
        // advance to next segment / finish
        this.advance()
      } else {
        this.remaining -= remainingSeconds
        remainingSeconds = 0
        this.state = {
          kind: "running",
          segmentIndex: this.segIdx,
          round: this.round,
          remaining: Math.ceil(this.remaining),
        }
        this.emit()
      }
    }
  }

  get currentSpec(): TimerSpec | null {
    return this.spec
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    fn(this.state)
    return () => this.listeners.delete(fn)
  }
  private emit() {
    this.listeners.forEach((l) => l(this.state))
  }

  load(spec: TimerSpec) {
    this.reset()
    this.spec = spec
    this.state = { kind: "idle" }
    this.emit()
  }

  start() {
    if (!this.spec) return
    const cd = this.spec.options?.countdown ?? 0
    if (cd > 0) {
      this.remaining = cd
      this.state = { kind: "countdown", remaining: this.remaining }
      this.emit()
    } else {
      this.beginFirst()
    }
    this.beginTick()
  }

  pause() {
    if (this.ticker) clearInterval(this.ticker)
    if (this.state.kind === "running") {
      this.state = {
        kind: "paused",
        segmentIndex: this.segIdx,
        round: this.round,
        remaining: this.remaining,
      }
      this.emit()
    }
  }

  resume() {
    if (this.state.kind !== "paused") return
    this.state = {
      kind: "running",
      segmentIndex: this.segIdx,
      round: this.round,
      remaining: this.remaining,
    }
    this.emit()
    this.beginTick()
  }

  restart() {
    if (!this.spec) return
    this.reset()
    this.start()
  }

  next() {
    this.advance()
    this.emit()
  }
  prev() {
    if (!this.spec) return
    if (this.segIdx > 0) this.segIdx--
    else if (this.round > 1) {
      this.round--
      this.segIdx = this.spec.segments.length - 1
    }
    this.remaining = this.spec.segments[this.segIdx].seconds
    this.state = {
      kind: "running",
      segmentIndex: this.segIdx,
      round: this.round,
      remaining: this.remaining,
    }
    this.emit()
  }

  private beginTick() {
    if (this.ticker) clearInterval(this.ticker)
    this.lastTickAt = Date.now()
    this.ticker = setInterval(() => {
      if (this.lastTickAt == null) {
        this.lastTickAt = Date.now()
        return
      }
      const now = Date.now()
      const delta = now - this.lastTickAt
      this.lastTickAt = now
      this.onTick(delta)
    }, 200) // 5Hz for drift resistance; not frame-heavy
  }

  private onTick(deltaMs: number) {
    if (!this.spec) return
    if (this.backgrounded) {
      this.backgroundElapsedMs += deltaMs
    }
    if (this.state.kind === "countdown") {
      this.remaining = Math.max(0, this.remaining - deltaMs / 1000)
      const remainInt = Math.ceil(this.remaining)
      this.state = { kind: "countdown", remaining: remainInt }
      this.emit()
      if (this.remaining <= 0) this.beginFirst()
      return
    }
    if (this.state.kind !== "running") return
    this.remaining = Math.max(0, this.remaining - deltaMs / 1000)
    const remainInt = Math.ceil(this.remaining)
    this.state = {
      kind: "running",
      segmentIndex: this.segIdx,
      round: this.round,
      remaining: remainInt,
    }
    this.emit()
    if (this.remaining <= 0) this.advance()
  }

  private beginFirst() {
    if (!this.spec) return
    this.segIdx = 0
    this.round = 1
    this.remaining = this.spec.segments[0].seconds
    this.state = {
      kind: "running",
      segmentIndex: 0,
      round: 1,
      remaining: this.spec.segments[0].seconds,
    }
    this.emit()
  }

  private advance() {
    if (!this.spec) return

    // Check if we're in the last round and just finished the work segment
    // (assuming work is always the first segment, rest is second)
    const isLastRound = this.round === this.spec.rounds
    const justFinishedWork = this.segIdx === 0 && this.spec.segments.length > 1

    if (isLastRound && justFinishedWork) {
      // Skip the rest interval after the final work interval
      this.finish()
      return
    }

    if (this.segIdx < this.spec.segments.length - 1) {
      this.segIdx++
    } else {
      if (this.round < this.spec.rounds) {
        this.round++
        this.segIdx = 0
      } else {
        this.finish()
        return
      }
    }
    this.remaining = this.spec.segments[this.segIdx].seconds
    this.state = {
      kind: "running",
      segmentIndex: this.segIdx,
      round: this.round,
      remaining: this.remaining,
    }
    this.emit()
  }

  private finish() {
    if (this.ticker) clearInterval(this.ticker)
    this.ticker = undefined
    this.lastTickAt = null
    this.state = { kind: "finished" }
    this.emit()
  }

  private reset() {
    if (this.ticker) clearInterval(this.ticker)
    this.ticker = undefined
    this.lastTickAt = null
    this.backgrounded = false
    this.backgroundElapsedMs = 0
    this.state = { kind: "idle" }
    this.segIdx = 0
    this.round = 1
    this.remaining = 0
  }
}
