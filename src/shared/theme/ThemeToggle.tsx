import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from './useTheme';
import { ThemeMode } from './ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'system', label: 'System Theme', icon: Laptop },
    { mode: 'light', label: 'Light Theme', icon: Sun },
    { mode: 'dark', label: 'Dark Theme', icon: Moon },
  ];

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className={`inline-flex items-center p-1 rounded-xl bg-zinc-900/80 dark:bg-zinc-900/80 border border-zinc-800 text-zinc-400 ${className}`}
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            aria-label={label}
            aria-pressed={isActive}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isActive
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline capitalize">{mode}</span>
          </button>
        );
      })}
    </div>
  );
}
