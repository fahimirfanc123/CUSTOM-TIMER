import { useEffect } from 'react';

export interface KeyboardShortcutsHandlers {
  onPauseResume?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onAddTime?: (seconds: number) => void;
}

export function useKeyboardShortcuts(
  isActive: boolean,
  handlers: KeyboardShortcutsHandlers
) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlers.onPauseResume?.();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handlers.onNext?.();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlers.onPrevious?.();
      } else if (e.key === '+' || e.key === '=' || e.key === '*') {
        e.preventDefault();
        handlers.onAddTime?.(10);
      } else if (e.key === '-') {
        e.preventDefault();
        handlers.onAddTime?.(-10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handlers]);
}
