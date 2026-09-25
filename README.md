# ⏱️ CTR — Custom Training Timer

> A high-performance, precision workout and interval training timer web application built with **React 19**, **TypeScript**, **Tailwind CSS**, and the **Web Audio API**.

---

## 🌟 Overview

**CTR (Custom Training Timer)** is an offline-first interval workout companion designed for athletes, fitness enthusiasts, and coaches. Whether training for high-intensity interval training (HIIT), boxing rounds, strength circuits, or custom timed routines, CTR provides precision drift-compensated timing, hands-free voice coaching, synthesized audio cues, and an intuitive workout builder.

---

## ✨ Key Features

### ⏱️ Precision Timer Engine
- **Drift-Compensated State Machine**: Millisecond-accurate timing that resists JavaScript event loop drift and browser throttling.
- **Dynamic Controls**:
  - Instant **Pause / Resume** with visual cues.
  - **Skip (Next)** and **Previous** segment navigation.
  - **Restart Current Set / Segment** on demand.
  - **Quick Time Adjustment**: Add or remove time on the fly (`+10s`, `-10s`, `+30s`).
- **Background Tab Resilience**: Automatically reconciles elapsed time using the Page Visibility API when returning from background tabs or locked devices.

### 🗣️ Dual-Engine Audio Feedback
- **Web Audio API Sound FX**: Clean, zero-latency synthesized audio frequencies for:
  - 3-2-1 countdown beeps (880 Hz / 1760 Hz cues)
  - Work start & completion horns
  - Rest period transitions
  - Workout victory fanfare
- **Speech Synthesis Voice Coach**: Hands-free voice announcements that speak upcoming exercises, set numbers, and rest phases.
- **Independent Toggles**: Easily toggle voice coach or sound effects on or off with quick-access header buttons.

### 🛠️ Visual Workout Builder
- **Multi-Exercise Routines**: Add unlimited exercises with distinct work and rest parameters.
- **Granular Customization**:
  - **Prepare Countdown**: 0 to 60 seconds
  - **Exercise Work Time**: Customizable minute/second duration
  - **Rest Between Sets**: Tailored recovery time per exercise
  - **Rest After Exercise**: Transition time before the next movement
  - **Rounds & Rest Between Rounds**: Repeat full circuits with dedicated round recovery
- **Drag & Reorder**: Move exercises up or down in the sequence or duplicate cards in one click.
- **Live Segment Preview Modal**: Inspect every generated segment step-by-step before starting.
- **Safety Dialogs**: Built-in confirmations for exercise deletion and unsaved changes.

### 🌓 Adaptive Dual-Theme System
- Full **Light Mode**, **Dark Mode**, and **System Auto-detection** support.
- Built on class-based Tailwind tokens with high-contrast palettes, ensuring readability under gym lighting or outdoors in direct sunlight.

### 📱 Mobile-First & Desktop Friendly
- **Screen Wake Lock API**: Prevents your phone or tablet screen from sleeping during active workouts.
- **Desktop Keyboard Shortcuts**: Control your timer hands-free from across the room.
- **Offline-First Persistence**: Custom workouts are automatically saved locally in IndexedDB via **Dexie.js**.

---

## ⌨️ Keyboard Shortcuts

When an active workout is in progress on desktop:

| Key | Action |
| :--- | :--- |
| `Space` | **Pause / Resume** timer |
| `→` (Right Arrow) | **Skip** to next segment |
| `←` (Left Arrow) | **Previous** segment |
| `+` / `=` | Add **+10 seconds** to current timer |
| `-` | Subtract **-10 seconds** from current timer |

---

## 🥊 Built-In Workout Presets

CTR includes ready-to-run presets out of the box:

1. **Quick Timer** — 30-second burst workout with a 5-second prepare phase.
2. **Boxing Rounds** — 3 rounds of 3 minutes shadow boxing with 1-minute rest between rounds.
3. **HIIT Circuit** — High-intensity interval circuit alternating Jumping Jacks and Mountain Climbers (3 sets each).
4. **Strength Training** — Foundational strength circuit: Push-ups, Dumbbell Shoulder Press, and Squats (3 sets with structured recovery).

---

## 🏗️ Architecture & Project Structure

```
src/
├── app/                  # Application root and global shell styling
│   ├── App.tsx           # Main router & view switcher (Home, Player, Builder)
│   └── app.css
├── core/                 # Framework-agnostic domain logic
│   ├── audio/            # Web Audio API SoundEngine, VoiceCoach, AudioCoordinator
│   ├── builder/          # SegmentBuilder & Workout validation engine
│   ├── engine/           # Drift-compensated TimerEngine state machine & Clock
│   ├── models/           # Domain models (Workout, Exercise, Segment, Phase)
│   └── storage/          # IndexedDB database schema & WorkoutRepository (Dexie)
├── features/             # Feature-based UI components
│   ├── workout-builder/  # Workout creator, exercise cards, preview, summary
│   └── workout-player/   # Active timer HUD, controls, progress, complete screen
└── shared/               # Shared utilities, hooks, components & theme
    ├── components/       # Stepper, DurationInput, Toast
    ├── hooks/            # useWakeLock, useKeyboardShortcuts
    ├── theme/            # ThemeProvider, ThemeToggle, useTheme
    └── utils/            # Time formatting utilities
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** (or `pnpm` / `yarn`)

### Installation
Clone the repository and install dependencies:

```bash
git clone git@github.com:fahimirfanc123/CUSTOM-TIMER.git
cd CUSTOM-TIMER
npm install
```

### Running the Development Server
Start Vite's fast local development server:

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Tests
Execute the unit and integration test suite using Vitest:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Building for Production
Create an optimized production bundle:

```bash
npm run build
```
The output will be placed in the `dist/` directory, ready to be deployed to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

---

## 🧰 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Local Storage**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Bundler & Tooling**: [Vite 5](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/react)
- **Audio**: Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`) & Web Speech API (`SpeechSynthesis`)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
