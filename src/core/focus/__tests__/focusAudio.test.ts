import { describe, it, expect, beforeEach } from 'vitest';
import { FocusAudioCoordinator, MockFocusSoundEngine, MockFocusSpeechEngine } from '../focusAudio';
import { FocusTimerController } from '../focusTimerController';
import { MockClock, ManualScheduler } from '../../engine/clock';

describe('Focus Audio Coordinator Tests (Module 7)', () => {
  let soundEngine: MockFocusSoundEngine;
  let speechEngine: MockFocusSpeechEngine;
  let coordinator: FocusAudioCoordinator;

  beforeEach(() => {
    soundEngine = new MockFocusSoundEngine();
    speechEngine = new MockFocusSpeechEngine();
    coordinator = new FocusAudioCoordinator({
      soundEngine,
      speechEngine,
      soundEnabled: true,
      voiceEnabled: true,
      volume: 0.8,
    });
  });

  it('41. plays focus start cue and speech', async () => {
    await coordinator.handleFocusStart();
    expect(soundEngine.history).toContain('FOCUS_START');
    expect(speechEngine.history).toContain('Focus session started.');
  });

  it('42. plays focus complete cue and speech for break', async () => {
    await coordinator.handleFocusComplete(5, false);
    expect(soundEngine.history).toContain('FOCUS_COMPLETE');
    expect(speechEngine.history).toContain('Focus complete. Take a 5 minute break.');
  });

  it('43. plays break start cue and speech', async () => {
    await coordinator.handleBreakStart();
    expect(soundEngine.history).toContain('BREAK_START');
    expect(speechEngine.history).toContain('Break started.');
  });

  it('44. plays break complete cue and speech', async () => {
    await coordinator.handleBreakComplete();
    expect(soundEngine.history).toContain('BREAK_COMPLETE');
    expect(speechEngine.history).toContain('Break complete.');
  });

  it('45. respects sound OFF preference', async () => {
    coordinator.updateConfig(false, true);
    await coordinator.handleFocusStart();
    expect(soundEngine.history).toHaveLength(0);
    expect(speechEngine.history).toContain('Focus session started.');
  });

  it('46. respects volume adjustments', () => {
    coordinator.updateConfig(true, true, 0.4);
    expect(soundEngine.volume).toBeCloseTo(0.4);
  });

  it('47. audio engine failure does not crash timer engine', async () => {
    soundEngine.shouldFail = true;
    speechEngine.shouldFail = true;

    const clock = new MockClock(1000000);
    const scheduler = new ManualScheduler();

    const controller = new FocusTimerController({
      clock,
      scheduler,
      soundEngine,
      speechEngine,
      initialConfig: { focusDurationSec: 5 },
      autoRestore: false,
    });

    // Should not throw
    await expect(controller.startFocus()).resolves.not.toThrow();

    clock.advanceBy(5000);
    expect(() => scheduler.triggerTick()).not.toThrow();
    expect(controller.getSnapshot().todayCompletedSessions).toBe(1);
  });
});
