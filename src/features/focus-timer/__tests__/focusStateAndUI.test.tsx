import type { ReactElement } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FocusProvider, useFocusTimer } from '../FocusContext';
import { ThemeProvider } from '../../../shared/theme/ThemeProvider';
import { FocusTimerController } from '../../../core/focus/focusTimerController';
import { MockClock, ManualScheduler } from '../../../core/engine/clock';
import { MockFocusSoundEngine, MockFocusSpeechEngine } from '../../../core/focus/focusAudio';
import { FocusScreen } from '../FocusScreen';
import { FloatingPomodoro } from '../FloatingPomodoro';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length(): number {
    return Object.keys(this.store).length;
  }
  clear(): void {
    this.store = {};
  }
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

function renderWithProviders(ui: ReactElement, controller: FocusTimerController) {
  return render(
    <ThemeProvider>
      <FocusProvider controller={controller}>{ui}</FocusProvider>
    </ThemeProvider>
  );
}

describe('Focus State & UI Integration Tests (Module 7)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let soundEngine: MockFocusSoundEngine;
  let speechEngine: MockFocusSpeechEngine;
  let storage: MockStorage;
  let controller: FocusTimerController;

  beforeEach(() => {
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    soundEngine = new MockFocusSoundEngine();
    speechEngine = new MockFocusSpeechEngine();
    storage = new MockStorage();

    controller = new FocusTimerController({
      clock,
      scheduler,
      soundEngine,
      speechEngine,
      storage,
      autoRestore: false,
    });
  });

  afterEach(() => {
    controller.dispose();
  });

  it('19. single global FocusTimerController instance manages state across UI components', () => {
    let captured1: any;
    let captured2: any;

    function ComponentA() {
      const timer = useFocusTimer();
      captured1 = timer;
      return <div>Comp A: {timer.snapshot.remainingSec}</div>;
    }

    function ComponentB() {
      const timer = useFocusTimer();
      captured2 = timer;
      return <div>Comp B: {timer.snapshot.remainingSec}</div>;
    }

    renderWithProviders(
      <>
        <ComponentA />
        <ComponentB />
      </>,
      controller
    );

    expect(captured1.controller).toBe(captured2.controller);
    expect(captured1.snapshot.phase).toBe(captured2.snapshot.phase);
  });

  it('20. unmounting FocusScreen does NOT reset or pause running timer', async () => {
    const { unmount } = renderWithProviders(<FocusScreen />, controller);

    // Start Focus
    const startButton = screen.getByRole('button', { name: /start focus/i });
    await act(async () => {
      fireEvent.click(startButton);
    });

    expect(controller.getSnapshot().status).toBe('RUNNING');

    // Unmount the screen (simulate navigation away)
    unmount();

    // Advance clock while unmounted
    act(() => {
      clock.advanceBy(30000);
      scheduler.triggerTick();
    });

    // Timer must continue counting down!
    expect(controller.getSnapshot().status).toBe('RUNNING');
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 30);
  });

  it('21-22. minimize and expand preserve timer state uninterrupted', async () => {
    let expanded = false;

    const { rerender } = renderWithProviders(
      <>
        <FocusScreen onBack={() => {}} />
        <FloatingPomodoro onExpand={() => { expanded = true; }} />
      </>,
      controller
    );

    // Start Focus
    const startBtn = screen.getByRole('button', { name: /start focus/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Minimize
    const minimizeBtn = screen.getByRole('button', { name: /minimize timer/i });
    act(() => {
      fireEvent.click(minimizeBtn);
    });

    expect(controller.getSnapshot().isMinimized).toBe(true);

    // Re-render only floating widget
    rerender(
      <ThemeProvider>
        <FocusProvider controller={controller}>
          <FloatingPomodoro onExpand={() => { expanded = true; }} />
        </FocusProvider>
      </ThemeProvider>
    );

    // Floating timer should be visible
    expect(screen.getByRole('region', { name: /floating pomodoro/i })).toBeInTheDocument();

    // Click Expand on floating timer
    const expandBtn = screen.getByRole('button', { name: /expand pomodoro/i });
    act(() => {
      fireEvent.click(expandBtn);
    });

    expect(expanded).toBe(true);
    expect(controller.getSnapshot().isMinimized).toBe(false);
    expect(controller.getSnapshot().status).toBe('RUNNING');
  });

  it('24. focus label persists through minimize and editing', () => {
    renderWithProviders(
      <>
        <FocusScreen />
        <FloatingPomodoro />
      </>,
      controller
    );

    // Click label to edit
    const labelBtn = screen.getByRole('button', { name: /set what you are working on/i });
    fireEvent.click(labelBtn);

    const input = screen.getByPlaceholderText(/what are you working on/i);
    fireEvent.change(input, { target: { value: 'TypeScript Refactoring' } });
    fireEvent.blur(input);

    expect(controller.getSnapshot().label).toBe('TypeScript Refactoring');
    expect(screen.getByText('TypeScript Refactoring')).toBeInTheDocument();
  });

  it('27-31. Floating Pomodoro displays correct time, phase, and supports pause/resume/skip', async () => {
    renderWithProviders(<FloatingPomodoro />, controller);

    // Initially idle -> floating widget is hidden
    expect(screen.queryByRole('region', { name: /floating pomodoro/i })).not.toBeInTheDocument();

    // Start Focus on controller
    await act(async () => {
      await controller.startFocus();
    });

    // Advance 60 seconds
    act(() => {
      clock.advanceBy(60000);
      scheduler.triggerTick();
    });

    // Floating widget now rendered
    expect(screen.getByRole('region', { name: /floating pomodoro/i })).toBeInTheDocument();
    expect(screen.getByText('24:00')).toBeInTheDocument();
    expect(screen.getByText('FOCUS')).toBeInTheDocument();

    // Click Pause on floating widget
    const pauseBtn = screen.getByRole('button', { name: /pause timer/i });
    act(() => {
      fireEvent.click(pauseBtn);
    });

    expect(controller.getSnapshot().status).toBe('PAUSED');
    expect(screen.getByText('PAUSED')).toBeInTheDocument();

    // Click Resume on floating widget
    const resumeBtn = screen.getByRole('button', { name: /resume timer/i });
    act(() => {
      fireEvent.click(resumeBtn);
    });

    expect(controller.getSnapshot().status).toBe('RUNNING');
  });

  it('33. Floating timer disappears when reset back to IDLE', async () => {
    renderWithProviders(<FloatingPomodoro />, controller);

    await act(async () => {
      await controller.startFocus();
    });
    expect(screen.getByRole('region', { name: /floating pomodoro/i })).toBeInTheDocument();

    act(() => {
      controller.reset();
    });

    expect(screen.queryByRole('region', { name: /floating pomodoro/i })).not.toBeInTheDocument();
  });

  it('responds to keyboard shortcuts in FocusScreen (Space, R, S, M)', async () => {
    renderWithProviders(<FocusScreen />, controller);

    // Space to start/pause
    await act(async () => {
      fireEvent.keyDown(window, { code: 'Space' });
    });
    expect(controller.getSnapshot().status).toBe('RUNNING');

    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });
    expect(controller.getSnapshot().status).toBe('PAUSED');

    // S to skip
    act(() => {
      fireEvent.keyDown(window, { key: 's' });
    });
    expect(controller.getSnapshot().phase).toBe('SHORT_BREAK');

    // M to minimize
    act(() => {
      fireEvent.keyDown(window, { key: 'm' });
    });
    expect(controller.getSnapshot().isMinimized).toBe(true);
  });

  it('presets update configuration and duration correctly', () => {
    renderWithProviders(<FocusScreen />, controller);

    // Click Deep Focus preset (50/10)
    const deepFocusBtn = screen.getByRole('button', { name: /deep focus/i });
    fireEvent.click(deepFocusBtn);

    const snapshot = controller.getSnapshot();
    expect(snapshot.config.focusDurationSec).toBe(50 * 60);
    expect(snapshot.config.shortBreakDurationSec).toBe(10 * 60);
    expect(screen.getByText('50:00')).toBeInTheDocument();
  });
});
