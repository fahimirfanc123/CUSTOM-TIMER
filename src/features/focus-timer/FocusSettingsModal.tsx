import { useState } from 'react';
import { FocusConfig, FocusPreset, focusPresets } from '../../core/focus/types';
import { X, Sliders, Volume2, VolumeX, Mic, MicOff, Sparkles } from 'lucide-react';
import { Stepper } from '../../shared/components/Stepper';

export interface FocusSettingsModalProps {
  isOpen: boolean;
  config: FocusConfig;
  onSave: (config: Partial<FocusConfig>) => void;
  onClose: () => void;
}

export function FocusSettingsModal({
  isOpen,
  config,
  onSave,
  onClose,
}: FocusSettingsModalProps) {
  const [focusMin, setFocusMin] = useState(() => Math.round(config.focusDurationSec / 60));
  const [shortBreakMin, setShortBreakMin] = useState(() => Math.round(config.shortBreakDurationSec / 60));
  const [longBreakMin, setLongBreakMin] = useState(() => Math.round(config.longBreakDurationSec / 60));
  const [sessionsCount, setSessionsCount] = useState(() => config.sessionsBeforeLongBreak);
  const [autoStartBreaks, setAutoStartBreaks] = useState(() => config.autoStartBreaks);
  const [autoStartFocus, setAutoStartFocus] = useState(() => config.autoStartFocus);
  const [soundEnabled, setSoundEnabled] = useState(() => config.soundEnabled);
  const [voiceEnabled, setVoiceEnabled] = useState(() => config.voiceEnabled);

  // Detect current preset match
  const getCurrentPreset = (): FocusPreset => {
    const fSec = focusMin * 60;
    const sSec = shortBreakMin * 60;
    const lSec = longBreakMin * 60;

    for (const [key, val] of Object.entries(focusPresets)) {
      if (
        val.focusDurationSec === fSec &&
        val.shortBreakDurationSec === sSec &&
        val.longBreakDurationSec === lSec &&
        val.sessionsBeforeLongBreak === sessionsCount
      ) {
        return key as FocusPreset;
      }
    }
    return 'CUSTOM';
  };

  const handleSelectPreset = (preset: Exclude<FocusPreset, 'CUSTOM'>) => {
    const val = focusPresets[preset];
    setFocusMin(Math.round(val.focusDurationSec / 60));
    setShortBreakMin(Math.round(val.shortBreakDurationSec / 60));
    setLongBreakMin(Math.round(val.longBreakDurationSec / 60));
    setSessionsCount(val.sessionsBeforeLongBreak);
  };

  const handleDevQuickTest = () => {
    // 10s focus, 5s short break, 8s long break, 2 sessions
    onSave({
      focusDurationSec: 10,
      shortBreakDurationSec: 5,
      longBreakDurationSec: 8,
      sessionsBeforeLongBreak: 2,
      autoStartBreaks,
      autoStartFocus,
      soundEnabled,
      voiceEnabled,
    });
    onClose();
  };

  const handleSave = () => {
    onSave({
      focusDurationSec: Math.max(1, focusMin) * 60,
      shortBreakDurationSec: Math.max(1, shortBreakMin) * 60,
      longBreakDurationSec: Math.max(1, longBreakMin) * 60,
      sessionsBeforeLongBreak: Math.max(1, sessionsCount),
      autoStartBreaks,
      autoStartFocus,
      soundEnabled,
      voiceEnabled,
    });
    onClose();
  };

  if (!isOpen) return null;

  const activePreset = getCurrentPreset();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="focus-settings-title" className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                Focus Timer Settings
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Customize session durations, intervals, and automation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Row */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Presets
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPreset('CLASSIC')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                activePreset === 'CLASSIC'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-bold uppercase">Classic</div>
              <div className="text-[11px] opacity-75 font-mono">25 / 5 / 15</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('DEEP_FOCUS')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                activePreset === 'DEEP_FOCUS'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-bold uppercase">Deep Focus</div>
              <div className="text-[11px] opacity-75 font-mono">50 / 10 / 20</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('SPRINT')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                activePreset === 'SPRINT'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-bold uppercase">Sprint</div>
              <div className="text-[11px] opacity-75 font-mono">15 / 3 / 10</div>
            </button>
          </div>
        </div>

        {/* Durations Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">Focus Duration</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Length of each focus period</div>
            </div>
            <Stepper
              label="Focus Duration"
              value={focusMin}
              min={1}
              max={120}
              step={5}
              unit="min"
              onChange={(val) => setFocusMin(val)}
            />
          </div>

          <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">Short Break</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Regular break interval</div>
            </div>
            <Stepper
              label="Short Break Duration"
              value={shortBreakMin}
              min={1}
              max={30}
              step={1}
              unit="min"
              onChange={(val) => setShortBreakMin(val)}
            />
          </div>

          <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">Long Break</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Extended rest interval</div>
            </div>
            <Stepper
              label="Long Break Duration"
              value={longBreakMin}
              min={1}
              max={60}
              step={5}
              unit="min"
              onChange={(val) => setLongBreakMin(val)}
            />
          </div>

          <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">Long Break After</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Number of focus sessions</div>
            </div>
            <Stepper
              label="Long Break Sessions"
              value={sessionsCount}
              min={1}
              max={12}
              step={1}
              unit="sessions"
              onChange={(val) => setSessionsCount(val)}
            />
          </div>
        </div>

        {/* Automation Toggles */}
        <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Automation & Audio
          </label>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900 dark:text-white">Auto-start Breaks</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Automatically begin break when focus finishes</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoStartBreaks}
              aria-label="Toggle auto-start breaks"
              onClick={() => setAutoStartBreaks(!autoStartBreaks)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoStartBreaks ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  autoStartBreaks ? 'translate-x-6' : 'translate-x-1'
                } top-0.5 absolute shadow`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900 dark:text-white">Auto-start Focus</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Automatically begin next focus when break finishes</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoStartFocus}
              aria-label="Toggle auto-start focus"
              onClick={() => setAutoStartFocus(!autoStartFocus)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoStartFocus ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  autoStartFocus ? 'translate-x-6' : 'translate-x-1'
                } top-0.5 absolute shadow`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${
                voiceEnabled
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-400'
              }`}
            >
              {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span>Voice {voiceEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Development Mode Quick Test Button */}
        <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400">
            Testing / Fast Verification Mode:
          </div>
          <button
            type="button"
            onClick={handleDevQuickTest}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Fast Test (10s/5s)</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/30 cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
