# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR code or press i/a for simulator)
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
npm run lint       # Run ESLint + Prettier checks
```

No test framework is configured in this project.

## Architecture

**Interval Pro** is a React Native / Expo interval training timer app using Expo Router (file-based tab navigation).

### Data Flow

```
TimerStorage (AsyncStorage) ──► TimerProvider (Context)
                                      │
                              TimerEngine (class)
                                      │
                              EngineState ──► Screen components
```

### Key Abstractions

**`src/engine/timerEngine.ts`** — Pure timer logic class. Drives state through a subscriber pattern (`subscribe(fn)`). Ticks at 5Hz (200ms intervals) for drift resistance. States: `idle → countdown → running ↔ paused → finished`. Handles background fast-forward via `fastForward(elapsedMs)`.

**`src/context/TimerProvider.tsx`** — Single context wrapping all timer functionality. Combines engine control, CRUD operations via `TimerStorage`, sound playback (`expo-av`), haptics, background/foreground lifecycle, and notification scheduling. Exposes `useTimer()` hook.

**`src/context/SettingsProvider.tsx`** — Persists user preferences (`soundsEnabled`, `hapticsEnabled`, `countdownBeepsEnabled`, `themePreference`) to AsyncStorage. Exposes `useSettings()`. Must wrap `TimerProvider` (see `app/_layout.tsx`).

**`src/utils/themeGenerator.ts`** — Derives a full `TimerTheme` object from a `TimerSpec`'s work/rest segment colors. All run-screen colors come from here; don't hardcode colors in screens.

### Types (`src/types.ts`)

- `Segment` — id (`"work"` | `"rest"`), label, seconds, color, optional sound
- `TimerSpec` — the saved timer definition (id, name, rounds, segments, options)
- `EngineState` — discriminated union: `idle | countdown | running | paused | finished`

### Segment Convention

Timers always have exactly two segments: `id: "work"` (index 0) and `id: "rest"` (index 1). The engine skips the rest segment after the final round's work segment (`advance()` in `timerEngine.ts`).

### Navigation (Expo Router tabs)

- `app/index.tsx` — Timer list; tap to load & navigate to Run, long-press for edit/delete
- `app/run.tsx` — Active timer screen; auto-starts last-used timer on mount
- `app/create-timer.tsx` — Create/edit form; hidden from tab bar (`href: null`)
- `app/settings.tsx` — App preferences

### Background Behavior

When the app backgrounds, `TimerProvider` records a timestamp and schedules local notifications for each remaining segment boundary via `NotificationService`. On foreground return, it calls `engine.fastForward(elapsed)` to catch up and cancels pending notifications.

## Code Style

Prettier is enforced: no semicolons, double quotes, 2-space indent. Run `npm run lint` before committing.
