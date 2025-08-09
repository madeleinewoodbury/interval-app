import { TimerSpec } from "../types"

type Listener = (s: import("../types").EngineState) => void

export class TimerEngine {
  private spec: TimerSpec | null = null
  private listeners = new Set<Listener>()
  private ticker?: ReturnType<typeof setInterval>
  private state: import("../types").EngineState = { kind: "idle" }
  private segIdx = 0
  private round = 1
  private remaining = 0

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
    let last = Date.now()
    this.ticker = setInterval(() => {
      const now = Date.now()
      const delta = now - last
      last = now
      this.onTick(delta)
    }, 200) // 5Hz for drift resistance; not frame-heavy
  }

  private onTick(deltaMs: number) {
    if (!this.spec) return
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
    this.state = { kind: "finished" }
    this.emit()
  }

  private reset() {
    if (this.ticker) clearInterval(this.ticker)
    this.state = { kind: "idle" }
    this.segIdx = 0
    this.round = 1
    this.remaining = 0
  }
}
