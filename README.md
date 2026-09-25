<div align="center">

# ⏱️ CTR — CUSTOM TRAINING TIMER & FOCUS SUITE

<p align="center">
  <a href="https://github.com/fahimirfanc123/CUSTOM-TIMER">
    <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=24&duration=3000&pause=1000&color=FF4500&center=true&vCenter=true&width=700&lines=PRECISION+INTERVAL+WORKOUT+TIMER;SYSTEM-WIDE+ALWAYS-ON-TOP+POMODORO;DUAL-PLATFORM+%E2%80%94+WEB+%2B+NATIVE+TAURI+2;DRIFT-COMPENSATED+DEADLINE+ENGINE" alt="CTR Typing SVG" />
  </a>
</p>

<p align="center">
  <strong>The ultimate precision interval workout companion and OS-level deep work Pomodoro suite.</strong><br>
  Built with React 19, TypeScript Strict Mode, Tauri 2 (Rust), Web Audio Synthesis, and Dexie IndexedDB.
</p>

<p align="center">
  <a href="#-01--quick-start-interactive-guide"><img src="https://img.shields.io/badge/QUICK_START-GET_RUNNING-FF4500?style=for-the-badge&logo=rocket&logoColor=white" alt="Quick Start" /></a>
  <a href="#-05--windows-os-native-experience"><img src="https://img.shields.io/badge/WINDOWS_GUIDE-1--CLICK_SETUP-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows Guide" /></a>
  <a href="#-03--system-wide-always-on-top-pomodoro"><img src="https://img.shields.io/badge/POMODORO-ALWAYS_ON_TOP-2EA44F?style=for-the-badge&logo=clockify&logoColor=white" alt="Pomodoro Guide" /></a>
  <a href="#-09--test-matrix--verification"><img src="https://img.shields.io/badge/TESTS-233_PASSED-success?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" /></a>
</p>

---

### 🛡️ METADATA & BUILD STATUS

[![React 19](https://img.shields.io/badge/React-19.3-61dafb.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6_(Strict)-3178c6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0_(Rust)-FFC131.svg?style=flat-square&logo=tauri&logoColor=black)](https://tauri.app/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38b2ac.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1_(22_Suites)-729B1B.svg?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Dexie IndexedDB](https://img.shields.io/badge/Dexie.js-IndexedDB-blueviolet.svg?style=flat-square&logo=databricks&logoColor=white)](https://dexie.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_API-critical.svg?style=flat-square&logo=soundcharts&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

</div>

---

> *"Timing is everything. Whether you are sprinting through the final round of a HIIT circuit or locking in for 50 minutes of deep programming, CTR guarantees zero drift, zero audio clutter, and 100% focus."*

---

## `01 / SYSTEM OVERVIEW & ARCHITECTURE`

CTR is engineered from the ground up as a **dual-environment platform**. It operates seamlessly in any standard web browser while transforming into a native OS desktop application with system-level capabilities when compiled via **Tauri 2**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     CTR UNIFIED ARCHITECTURE                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
   🏃 WORKOUT INTERVAL ENGINE                                      🍅 POMODORO FOCUS SUITE
   - Drift-Compensated State Machine                               - Authoritative Controller
   - Segment Builder & Compiler                                    - Multi-tier Cycle Engine (25/5/15)
   - Procedural Web Audio Beeps & Horns                            - Single Audio Dispatch Guarantee
   - Hands-Free Speech Voice Coach                                 - Workout vs Pomodoro Conflict Handler
   - Dexie.js Offline Database                                     - Daily Focus Minutes & Stats
                 │                                                                 │
                 └────────────────────────────────┬────────────────────────────────┘
                                                  ▼
                                     IFocusDesktopBridge Adapter
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
             [🌐 WEB / BROWSER MODE]                           [🖥️ TAURI 2 DESKTOP MODE]
             WebFallbackDesktopBridge                          TauriDesktopBridge
                         │                                                 │
                         ▼                                                 ▼
             In-App Floating Widget                            Native OS Mini HUD Window
             <FloatingPomodoro />                              `pomodoro-mini` (260×120px)
             (Draggable within browser viewport)               (Always-on-Top over ALL OS Apps)
```

---

## `02 / VISUAL SHOWCASE & INTERFACE BLUEPRINTS`

### 1. Active Workout Interval Player HUD (ASCII Blueprint)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Workouts              🔥 HIIT CIRCUIT (Round 2 of 3)                  🔊 Sound  🗣️ Voice │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                │
│             CURRENT EXERCISE                                   REMAINING WORK TIME              │
│       ┌───────────────────────────┐                         ┌───────────────────────┐          │
│       │   JUMPING JACKS (Set 3)   │                         │        00:45          │          │
│       └───────────────────────────┘                         └───────────────────────┘          │
│                                                                                                │
│   ● PREPARE ────► ● WORK (Active) ────► ⏸ REST (Upcoming: Mountain Climbers) ────► 🏁 COMPLETE │
│   [████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 68%        │
│                                                                                                │
│                 [ ⏮ Prev ]    [ ⏸ PAUSE / RESUME (Space) ]    [ ⏭ Skip (→) ]                   │
│                               [ -10s ]      [ +10s ]                                           │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. OS-Level Always-On-Top Pomodoro Mini Window (`pomodoro-mini`)

```
┌──────────────────────────────────────────────────┐
│ 🍅 FOCUS • Set 2/4          📌 Pin  ↗ Expand  ✕ │ <── data-tauri-drag-region (Move anywhere)
├──────────────────────────────────────────────────┤
│                                                  │
│                    24:38                         │ <── Dominant Authoritative Countdown
│                                                  │
│  Writing Technical Documentation...              │ <── Live Synchronized Task Label
│  [██████████████████████░░░░░░░░░░░░░░░] 62%     │ <── Smooth Progress Bar
├──────────────────────────────────────────────────┤
│   [ ⏸ Pause ]          [ ⏭ Skip ]   [ ☕ Break ] │ <── Fast-Action Command Dispatches
└──────────────────────────────────────────────────┘
```

---

## `03 / SYSTEM-WIDE ALWAYS-ON-TOP POMODORO`

The Pomodoro Focus Suite in CTR is not just another browser timer. It is an **OS-level productivity companion** that keeps you locked into your flow state without getting in the way.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🍅 Focus Session (25:00) ──► ☕ Short Break (05:00) ──► [Cycles 1-4] ──► 🏖️ Long Break (15:00)│
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### ⚡ Technical Capabilities & Guarantees

| Feature | Description |
| :--- | :--- |
| **Authoritative Single Engine** | Remaining time is calculated as `Math.max(0, deadline - now)`. The mini UI is a passive observer with 250ms render frames — eliminating time drift. |
| **Always-On-Top Overlay** | Borderless, translucent, OS-level window that floats over VS Code, Visual Studio, Windows Terminal, Browser, and games. |
| **Multi-Monitor Coordinate Memory** | Remembers where you placed it. On boot, validates coordinates against `availableMonitors()`; if a monitor was disconnected, it recovers to the bottom-right of your primary screen. |
| **Single Audio Delivery** | Audio Coordinator only runs in the background main process. Zero duplicate chimes or voice echoes across multiple open windows. |
| **Conflict Resolution Engine** | Starting a workout while Pomodoro is running alerts you with an interactive dialog: gracefully pause your Pomodoro or keep focus active. |
| **Cross-Window Theme Sync** | Changing theme in the main app (Dark / Light / System) immediately broadcasts via IPC to update the mini window style. |
| **Background Resilience** | Minimizing or hiding the main window never pauses or cancels active sessions. Closing the main window hides it to the system tray. |

---

## `04 / DUAL-PLATFORM CAPABILITIES COMPARISON`

| Capability | 🌐 Web Browser (Chrome/Edge/Firefox) | 🖥️ Native Desktop (Tauri 2 on Win/Linux/macOS) |
| :--- | :---: | :---: |
| **Drift-Compensated Workout Timer** | ✅ Full Support | ✅ Full Support |
| **Voice Coach (Speech Synthesis)** | ✅ Full Support | ✅ Full Support |
| **Procedural Audio FX (Web Audio API)** | ✅ Zero Latency | ✅ Zero Latency |
| **Visual Workout Builder & Presets** | ✅ Full Support | ✅ Full Support |
| **Offline IndexedDB Storage (Dexie.js)** | ✅ Full Support | ✅ Full Support |
| **Screen Wake Lock API** | ✅ Supported (Mobile/Tablet) | ✅ Native OS Screen Keep-Awake |
| **Mini Pomodoro Experience** | In-App Draggable `<FloatingPomodoro />` | **Native OS Borderless Always-On-Top Window** |
| **System Tray Context Menu** | ❌ Browser Limited | **✅ Native Taskbar Tray (Pause, Open, Quit)** |
| **Global Background Execution** | Tab Throttling Protected | **✅ Zero OS Throttling & Minimize-to-Tray** |
| **Multi-Monitor Position Recovery** | ❌ Browser Viewport Only | **✅ Hardware Multi-Monitor Boundary Validation** |

---

## `05 / WINDOWS OS NATIVE EXPERIENCE`

CTR is fully optimized for **Windows 10** and **Windows 11 (x64 & ARM64)**.

```
       ┌──────────────────────────────────────────────────────────────┐
       │ Windows Taskbar ──► [ ^ ] [ 🔊 ] [ 🌐 ] [ 🍅 CTR Tray ] [ 12:00 ] │
       └──────────────────────────────────────────────────────────────┘
```

### 🌟 Windows Native Features:
1. **Windows Notification Area Tray**: Lives in your taskbar tray near the clock. Right-click for instant actions (*Open CTR*, *Show/Hide Mini*, *Pause/Resume*, *Quit*).
2. **True Windows Always-On-Top**: Stays pinned on top of Visual Studio, VS Code, Office, Discord, Slack, and full-screen browsers.
3. **High-DPI Scaling**: Crisp typography and vector graphics scaled across $100\%$, $125\%$, $150\%$, and $200\%$ display scaling on 1080p, 1440p, and 4K displays.
4. **PWA Support**: In Microsoft Edge or Chrome, click `Install CTR` to run as a dedicated Windows App without compiling Rust.

### 🚀 1-Click Windows Setup (PowerShell):
Open **PowerShell** as Administrator and paste:

```powershell
# 1. Install prerequisites via winget
winget install OpenJS.NodeJS -e
winget install Git.Git -e
winget install Rustlang.Rustup -e
winget install Microsoft.VisualStudio.2022.BuildTools --force --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended"

# 2. Clone repository & launch desktop application
git clone https://github.com/fahimirfanc123/CUSTOM-TIMER.git
cd CUSTOM-TIMER
npm install
npm run tauri:dev
```

### 📦 Build Windows `.msi` / `.exe` Installer:
```powershell
npm run tauri:build
```
Your standalone installer will be built in:
`src-tauri\target\release\bundle\msi\CTR - Custom Training Timer_x64_en-US.msi`

---

## `06 / LINUX & MACOS QUICK START`

<details open>
<summary><b>🐧 Ubuntu / Debian Linux Setup</b></summary>

```bash
# 1. Install system dependencies
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

# 2. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# 3. Clone & Launch
git clone https://github.com/fahimirfanc123/CUSTOM-TIMER.git
cd CUSTOM-TIMER
npm install
npm run tauri:dev
```
</details>

<details>
<summary><b>🍎 macOS Setup</b></summary>

```bash
# 1. Install Xcode tools & Rust
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# 2. Clone & Launch
git clone https://github.com/fahimirfanc123/CUSTOM-TIMER.git
cd CUSTOM-TIMER
npm install
npm run tauri:dev
```
</details>

---

## `07 / KEYBOARD SHORTCUTS MATRIX`

### 🏋️ Active Workout HUD
| Key | Action | Function |
| :---: | :--- | :--- |
| `Space` | **Pause / Resume** | Toggle countdown state instantly |
| `→` | **Skip Next** | Step forward to the next work/rest interval |
| `←` | **Previous** | Return to previous exercise segment |
| `+` / `=` | **+10 Seconds** | Add time to the active segment on the fly |
| `-` | **-10 Seconds** | Deduct time from the active segment |

### 🍅 Pomodoro Mini Window
| Action | Control | Function |
| :---: | :--- | :--- |
| **Drag** | `data-tauri-drag-region` | Click and hold anywhere in the window to reposition |
| **Pin** | Click `📌` | Toggle Always-On-Top OS priority |
| **Expand** | Click `↗` | Restore and bring main CTR window into focus |
| **Play/Pause** | Click `⏸` / `▶` | Dispatch pause/resume to background controller |
| **Skip** | Click `⏭` | Immediately transition to the next phase |

---

## `08 / TECH SPECTRUM & PROCEDURAL AUDIO`

<div align="center">

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CORE TECH SPECTRUM                                        │
├───────────────────┬───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│     FRONTEND      │      DESKTOP      │      STORAGE      │      AUDIO FX     │     TESTING     │
├───────────────────┼───────────────────┼───────────────────┼───────────────────┼─────────────────┤
│  React 19 (Hooks) │  Tauri 2 (Rust)   │  Dexie.js (IDB)   │  Web Audio API    │  Vitest 2.1     │
│  TypeScript 5.6   │  Tauri Event Bus  │  LocalStorage     │  SpeechSynthesis  │  Testing Lib    │
│  Tailwind CSS 3.4 │  System Tray API  │  IndexedDB v4     │  Procedural Synth │  Coverage 100%  │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

<br>

<img src="https://skillicons.dev/icons?i=react,ts,rust,tailwind,vite,html,css,linux,windows,apple&theme=dark" alt="Tech Stack Icons" />

</div>

### 🔊 Procedural Audio & Synthesis Chart
CTR does not rely on static MP3/WAV files that can fail to load. All sound effects are **synthesized procedurally** using the browser's native `AudioContext`:

| Cue Identifier | Frequency / Tone Pattern | Waveform | Purpose |
| :--- | :--- | :---: | :--- |
| `COUNTDOWN_TICK` | $880\,\text{Hz}$ (A5), $100\text{ms}$ pulse | Sine | 3-2-1 prepare and final seconds countdown |
| `COUNTDOWN_FINAL` | $1760\,\text{Hz}$ (A6), $250\text{ms}$ high burst | Sine | Exact transition second trigger |
| `WORK_START` | Double fanfare ($587.33\,\text{Hz} \rightarrow 880\,\text{Hz}$) | Triangle | Work period beginning horn |
| `WORK_COMPLETE` | Major triad chord ($523.25\,\text{Hz} \rightarrow 659.25\,\text{Hz} \rightarrow 783.99\,\text{Hz}$) | Sine | Exercise completion bell |
| `FOCUS_COMPLETE` | Harmonized chime ($523.25\,\text{Hz} + 659.25\,\text{Hz}$) | Sine | Pomodoro focus session finish |
| `BREAK_COMPLETE` | Dual rising notification tone | Sine | Rest/Break completion alert |

---

## `09 / TEST MATRIX & VERIFICATION`

CTR features **22 automated test suites** containing **233 unit and integration tests** with **100% pass rate**.

```bash
npm test
```

```
 ✓ src/core/engine/__tests__/timerEngine.test.ts (26 tests)
 ✓ src/core/audio/__tests__/audioCoordinator.test.ts (16 tests)
 ✓ src/core/audio/__tests__/progressiveAudio.test.ts (3 tests)
 ✓ src/core/audio/__tests__/durationFormatter.test.ts (4 tests)
 ✓ src/core/builder/__tests__/segmentBuilder.test.ts (8 tests)
 ✓ src/core/builder/__tests__/validator.test.ts (14 tests)
 ✓ src/core/storage/__tests__/workoutRepository.test.ts (8 tests)
 ✓ src/core/focus/__tests__/focusTimerController.test.ts (27 tests)
 ✓ src/core/focus/__tests__/focusAudio.test.ts (7 tests)
 ✓ src/core/focus/__tests__/desktopBridge.test.ts (8 tests)
 ✓ src/features/focus-timer/__tests__/focusStateAndUI.test.tsx (8 tests)
 ✓ src/features/focus-timer/__tests__/workoutConflict.test.tsx (5 tests)
 ✓ src/features/focus-timer/__tests__/desktopSharedState.test.ts (10 tests)
 ✓ src/features/focus-timer/__tests__/desktopLifecycle.test.ts (7 tests)
 ✓ src/features/focus-timer/__tests__/desktopTimingAndAudio.test.ts (11 tests)
 ✓ src/features/focus-timer/__tests__/desktopThemeSync.test.ts (4 tests)
 ✓ src/features/workout-player/__tests__/workoutPlayer.test.tsx (27 tests)
 ✓ src/features/workout-player/__tests__/homeIntegration.test.tsx (8 tests)
 ✓ src/features/workout-player/__tests__/sessionController.test.ts (8 tests)
 ✓ src/features/workout-builder/__tests__/workoutBuilder.test.tsx (10 tests)
 ✓ src/features/workout-builder/__tests__/builderDomain.test.ts (9 tests)
 ✓ src/shared/theme/__tests__/theme.test.tsx (5 tests)

Test Files  22 passed (22)
     Tests  233 passed (233)
  Duration  ~48s
```

---

## `10 / REPOSITORY & PROJECT STRUCTURE`

```
CTR/
├── src/
│   ├── app/                      # Main application shell & router
│   │   ├── App.tsx               # View router (Home, Player, Builder, Focus)
│   │   └── app.css               # Base CSS & Tailwind directives
│   ├── core/                     # Pure domain logic (Framework-agnostic)
│   │   ├── audio/                # Web Audio SoundEngine & VoiceCoach
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
│   │   └── utils/                # Time formatters & geometry calculators
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

## `11 / CONTRIBUTING & DEVELOPMENT`

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`)
4. Verify Tests & Types (`npm test && npx tsc --noEmit`)
5. Push to the Branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

---

## `12 / LICENSE`

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=16&duration=3000&pause=1000&color=2EA44F&center=true&vCenter=true&width=500&lines=CTR+%E2%80%94+PRECISION+MEETS+PERFORMANCE;TRAIN+HARDER.+FOCUS+DEEPER.;BUILT+WITH+PASSION." alt="Footer Typing SVG" />
</p>

⭐ **Found this useful? Star the repository on [GitHub](https://github.com/fahimirfanc123/CUSTOM-TIMER)!**

</div>
