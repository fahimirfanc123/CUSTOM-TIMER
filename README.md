# ⏱️ CTR — Custom Training Timer & Desktop Focus Suite

[![React](https://img.shields.io/badge/React-19.3-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131.svg?style=flat-square&logo=tauri)](https://tauri.app/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38b2ac.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-729B1B.svg?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> A high-performance, precision workout interval timer and system-wide Pomodoro focus suite built with **React 19**, **TypeScript**, **Tauri 2**, **Tailwind CSS**, and the **Web Audio API**.

---

## 🌟 Overview

**CTR (Custom Training Timer)** is an all-in-one precision timer application engineered for high performance, dual-platform flexibility (Web and Native Desktop), and offline-first reliability. 

CTR delivers two interconnected, world-class timing tools:
1. **🏃 Active Workout Interval Engine**: Designed for athletes, HIIT enthusiasts, boxers, and strength trainers who need drift-compensated interval timing, hands-free voice coaching, procedural audio synthesis, and an intuitive workout builder.
2. **🍅 System-Wide Pomodoro Focus Suite**: A productivity focus companion equipped with customizable Pomodoro intervals, daily statistics, task labeling, and a borderless **Always-On-Top Mini Window** that floats above all operating system windows (VS Code, terminal, browsers) even when the main app is minimized.

---

## ✨ Key Feature Highlights

### ⏱️ 1. Precision Workout Timer Engine
- **Drift-Compensated State Machine**: Millisecond-accurate timestamp calculations (`deadline - now`) immune to JavaScript event loop throttling and background tab suspension.
- **Full Playback Controls**:
  - Instant **Pause / Resume** with visual state feedback.
  - **Skip (Next)** and **Previous** segment stepping.
  - **Restart Current Set / Segment** on the fly.
  - **Quick Time Modifiers**: Add or subtract time dynamically (`+10s`, `-10s`, `+30s`).
- **Screen Wake Lock API**: Prevents mobile and tablet screens from sleeping during active workouts.
- **Page Visibility & Background Resilience**: Reconciles elapsed time instantly when returning from locked devices or unfocused tabs.

### 🗣️ 2. Dual-Engine Audio & Procedural Sound FX
- **Synthesized Web Audio FX**: Zero-latency, browser-native tone generation:
  - 3-2-1 progressive countdown beeps (880 Hz / 1760 Hz)
  - Work interval start horns & completion bells
  - Rest period recovery chimes & victory fanfare
- **Speech Synthesis Voice Coach**: Speaks upcoming exercise names, set numbers, and transition cues hands-free.
- **Independent Audio Controls**: Quick-toggle voice announcements and sound effects independently.

### 🛠️ 3. Visual Workout Builder & Library
- **Custom Routine Creator**: Build workouts with unlimited exercises, customized work periods, and multi-tiered rest durations.
- **Granular Timing Parameters**:
  - **Prepare Countdown**: 0 to 60 seconds
  - **Exercise Work Time**: Configurable minutes and seconds
  - **Rest Between Sets**: Tailored recovery time per movement
  - **Rest After Exercise**: Transition periods before changing exercises
  - **Rounds & Circuit Recovery**: Repeat circuits with dedicated round rest
- **Reordering & Duplication**: Move exercise cards up/down or clone them in one click.
- **Live Segment Preview Modal**: Inspect every computed segment and overall estimated duration before starting.
- **Pre-Built Workout Presets**: Quick Timer (30s), Boxing Rounds (3×3 min), HIIT Circuit, and Strength Training.

---

### 🍅 4. System-Wide Pomodoro Focus Timer

CTR includes a Pomodoro and deep work timer seamlessly integrated into both Web and Desktop workflows:

```
┌─────────────────────────────────────────────────────────────┐
│ 🍅 Focus Session (25:00) ──> ☕ Short Break (05:00) [Cycle] │
│ 🍅 Focus Session (25:00) ──> 🏖️ Long Break (15:00) [Done]  │
└─────────────────────────────────────────────────────────────┘
```

#### Key Pomodoro Features:
- **Configurable Presets**:
  - **Classic Pomodoro**: 25m Focus / 5m Short Break / 15m Long Break (4 cycles)
  - **Short Focus**: 15m Focus / 3m Short Break / 10m Long Break (4 cycles)
  - **Long Deep Work**: 50m Focus / 10m Short Break / 30m Long Break (2 cycles)
  - **Custom Mode**: User-defined focus, break durations, and long break intervals.
- **Automation Settings**:
  - Optional **Auto-Start Breaks** and **Auto-Start Focus** options.
  - Interactive **"Ready for Break?"** and **"Ready to Focus?"** transition prompts when auto-start is disabled.
- **Task Labeling**: Add customizable task descriptions (e.g., *"Writing Technical Spec"*, *"Reviewing PR #42"*) that synchronize everywhere.
- **Daily Focus Statistics**: Tracks total daily completed sessions and focus minutes persisted in local storage.
- **Intelligent Workout Conflict Resolver**: If you start a workout while a Pomodoro is running, CTR prompts a conflict dialog allowing you to gracefully pause the Pomodoro and start the workout.
- **Single Audio Engine Guarantee**: Background timer dispatches exactly one audio chime/voice cue upon completion without duplicate sound across multi-window views.

---

### 🖥️ 5. Native Desktop Integration (Tauri 2)

When running as an installed desktop app on **Linux**, **Windows**, or **macOS**:

- **Always-On-Top Borderless Mini Window**:
  - Compact ($260 \times 120\,\text{px}$), borderless, transparent HUD that stays visible over code editors, terminals, and full-screen tools.
  - Smooth native window dragging (`data-tauri-drag-region`).
  - Controls: Play/Pause (`⏸`/`▶`), Skip (`⏭`), Expand to Main App (`↗`), Pin (`📌`), and Close (`✕`).
- **Multi-Monitor Position Validation**:
  - Automatically remembers its screen coordinates.
  - Validates coordinates against connected monitors on startup; if a monitor was unplugged, it safely recovers to the bottom-right of the primary display.
- **System Tray Controls**:
  - Native OS tray menu with instant actions: *Open CTR*, *Show Pomodoro Mini*, *Hide Pomodoro Mini*, *Pause / Resume*, and *Quit*.
- **Background Execution & Window Lifecycle**:
  - Minimizing or hiding the main window **never** stops or pauses countdowns.
  - Closing the main window while Focus is running hides it to the tray, keeping your session uninterrupted.
- **Cross-Window Theme Synchronization**:
  - Switching between Dark Mode, Light Mode, or System Auto-detect in the main window propagates immediately to the mini window via Tauri IPC events.

---

## ⌨️ Keyboard Shortcuts

### Workout Player (Desktop)
| Key | Action |
| :--- | :--- |
| `Space` | **Pause / Resume** active workout |
| `→` (Right Arrow) | **Skip** to next segment |
| `←` (Left Arrow) | **Previous** segment |
| `+` / `=` | Add **+10 seconds** to current segment |
| `-` | Subtract **-10 seconds** from current segment |

### Pomodoro Mini Window (Desktop)
| Action | Control |
| :--- | :--- |
| **Move Window** | Click and drag any empty space in the mini window |
| **Toggle Always-On-Top** | Click the Pin icon (`📌`) |
| **Expand to Main App** | Click the Expand icon (`↗`) |
| **Quick Play / Pause** | Click the Play/Pause button |
| **Advance / Skip Phase** | Click the Skip button (`⏭`) |

---

## 🏗️ Architecture & Project Structure

```
CTR/
├── src/
│   ├── app/                      # Main application shell & router
│   │   ├── App.tsx               # View coordinator (Home, Player, Builder, Focus)
│   │   └── app.css               # Base styles & Tailwind directives
│   ├── core/                     # Pure domain logic (Framework-agnostic)
│   │   ├── audio/                # Web Audio sound engine & voice coach
│   │   ├── builder/              # Segment compiler & workout validator
│   │   ├── engine/               # Precision deadline timer engine & clock
│   │   ├── focus/                # FocusTimerController, FocusAudio, DesktopBridge
│   │   ├── models/               # Domain TypeScript interfaces & types
│   │   └── storage/              # IndexedDB database via Dexie.js
│   ├── features/                 # Feature-driven UI components
│   │   ├── focus-timer/          # FocusScreen, PomodoroMiniWindow, FloatingPomodoro
│   │   ├── workout-builder/      # WorkoutBuilder, ExerciseCard, PreviewModal
│   │   └── workout-player/       # WorkoutPlayer HUD, Controls, CompleteScreen
│   ├── shared/                   # Shared UI, theme, hooks, utilities
│   │   ├── components/           # Button, Modal, Stepper, DurationInput
│   │   ├── hooks/                # useWakeLock, useKeyboardShortcuts
│   │   ├── theme/                # ThemeProvider, ThemeToggle (Dark/Light/System)
│   │   └── utils/                # Formatters and coordinate calculators
│   └── main.tsx                  # Web & Mini-window route entry point
├── src-tauri/                    # Tauri 2 Desktop Backend (Rust)
│   ├── capabilities/             # Desktop permissions & window capabilities
│   ├── src/                      # Rust main entry, tray menu, window lifecycle
│   ├── Cargo.toml                # Rust dependencies (tauri, serde, etc.)
│   └── tauri.conf.json           # Tauri multi-window app configuration
├── package.json
└── vite.config.ts
```

---

## 🚀 Installation & Setup Guide

### 📋 Prerequisites

#### 1. For Web Development (All Platforms)
- **Node.js**: Version `18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node) or `pnpm` / `yarn`

#### 2. For Desktop Development (Tauri 2)
To build and run native desktop packages, install the required OS dependencies:

<details>
<summary><b>🐧 Ubuntu / Debian Linux</b></summary>

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  pkg-config

# Install Rust Toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```
</details>

<details>
<summary><b>🪟 Windows</b></summary>

1. Install the **Microsoft C++ Build Tools** via the [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (select "Desktop development with C++").
2. Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10/11).
3. Install Rust via [rustup-init.exe](https://www.rust-lang.org/tools/install).
</details>

<details>
<summary><b>🍎 macOS</b></summary>

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust Toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```
</details>

---

### 📥 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone git@github.com:fahimirfanc123/CUSTOM-TIMER.git
cd CUSTOM-TIMER

# Install NPM packages
npm install
```

---

### 🌐 2. Running the Web Application

Start the local Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 🖥️ 3. Running the Desktop Application (Tauri)

Launch the native desktop application with live-reloading:

```bash
npm run tauri:dev
```

---

### 🧪 4. Running the Test Suites

CTR comes with 22 test suites containing **233 unit and integration tests** covering the timer engines, audio synthesis, builders, desktop bridge adapters, cross-window IPC synchronization, and theme handling.

```bash
# Run the full test suite once
npm test

# Run tests in interactive watch mode
npm run test:watch
```

---

### 📦 5. Building for Production

#### Build Web Production Bundle:
```bash
npm run build
```
The compiled, minified bundle will be generated in `dist/`.

#### Build Native Desktop Installers:
```bash
npm run tauri:build
```
This builds standalone native binaries and installers in `src-tauri/target/release/bundle/`:
- **Linux**: `.deb` package and standalone `.AppImage`
- **Windows**: `.msi` and `.exe` installers
- **macOS**: `.dmg` disk image and `.app` bundle

---

## 📖 User Guide: How to Use CTR

### 🎯 Step 1: Navigating the Home Screen
- **My Workouts**: View, start, edit, duplicate, or delete your custom saved routines.
- **Presets Library**: Quick-start balanced routines (Quick Timer, Boxing Rounds, HIIT Circuit, Strength Training) or customize them by cloning into the builder.
- **Focus Timer Launcher**: Access the full-screen Pomodoro timer from the top navigation bar.
- **Theme Toggle**: Switch between Light, Dark, or System mode from the header.

### 🏋️ Step 2: Building a Custom Workout
1. Click **"Create Workout"** on the Home screen.
2. Enter a **Workout Title** and optional description.
3. Configure **Prepare Countdown** and global **Rounds**.
4. Add exercises with custom **Work Duration**, **Rest Between Sets**, and **Rest After Exercise**.
5. Use the **Move Up / Move Down** buttons to reorder exercises, or **Duplicate** to repeat movements.
6. Click **"Preview Workout"** to inspect the sequence of segments.
7. Click **"Save Workout"** to persist your routine locally in IndexedDB.

### ⚡ Step 3: Running an Active Workout
1. Click **"Start"** on any workout card.
2. The HUD displays the current segment, upcoming set, elapsed workout time, and segment countdown.
3. Use keyboard shortcuts (`Space` to pause/resume, `→` to skip) or touch controls.
4. Voice Coach speaks announcements before each set, while audio cues signal countdowns.

### 🍅 Step 4: Using the Pomodoro Focus Timer
1. Click **"Focus"** in the top navigation bar.
2. Set your task label (e.g., *"Coding Desktop Module"*).
3. Select a preset (**Classic 25/5**, **Short 15/3**, **Deep 50/10**, or **Custom** via Settings ⚙️).
4. Click **"Start Focus"** to begin countdown.
5. **Minimize Focus**:
   - **In Web**: Minimizes to a draggable in-app widget (`FloatingPomodoro`).
   - **In Desktop**: Minimizes to the borderless, system-wide **Always-On-Top Mini Window**.
6. When the timer completes, a chime sounds and you are guided into your break.
7. Click **"Expand"** (`↗`) at any time to return to the full CTR application.

---

## 🧰 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) |
| **Desktop Platform** | [Tauri 2](https://tauri.app/) (Rust Backend) |
| **Language** | [TypeScript 5.6](https://www.typescriptlang.org/) (Strict Mode) & [Rust](https://www.rust-lang.org/) |
| **Styling & Design System** | [Tailwind CSS 3.4](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Local Persistence** | [Dexie.js](https://dexie.org/) (IndexedDB) & `localStorage` |
| **Build & Tooling** | [Vite 5](https://vitejs.dev/) & [Cargo](https://doc.rust-lang.org/cargo/) |
| **Testing Framework** | [Vitest 2.1](https://vitest.dev/) & [React Testing Library](https://testing-library.com/react) |
| **Audio Synthesis** | Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`) & Web Speech API |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
