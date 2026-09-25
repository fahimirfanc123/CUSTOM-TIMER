import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusTimer } from './FocusContext';
import { Play, Pause, Maximize2, SkipForward } from 'lucide-react';
import { formatDigitalTime } from '../../shared/utils/timeFormat';

export interface FloatingPomodoroProps {
  onExpand?: () => void;
}

export function FloatingPomodoro({ onExpand }: FloatingPomodoroProps) {
  const { snapshot, pause, resume, start, skip, expand } = useFocusTimer();

  // Position state for desktop dragging
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // If timer is IDLE and not minimized, do not render floating widget
  const shouldShow =
    snapshot.isMinimized ||
    snapshot.status === 'RUNNING' ||
    snapshot.status === 'PAUSED' ||
    snapshot.status === 'AWAITING_NEXT_PHASE';

  // Handle expand action
  const handleExpand = useCallback(() => {
    expand();
    onExpand?.();
  }, [expand, onExpand]);

  // Pointer event handlers for custom drag
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag when clicking the drag handle or container, not buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position ? position.x : rect.left,
      posY: position ? position.y : rect.top,
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const width = containerRef.current?.offsetWidth || 240;
    const height = containerRef.current?.offsetHeight || 80;

    const newX = Math.max(16, Math.min(window.innerWidth - width - 16, dragStartRef.current.posX + deltaX));
    const newY = Math.max(16, Math.min(window.innerHeight - height - 16, dragStartRef.current.posY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  // Re-clamp position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (position && containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setPosition({
          x: Math.max(16, Math.min(window.innerWidth - width - 16, position.x)),
          y: Math.max(16, Math.min(window.innerHeight - height - 16, position.y)),
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  if (!shouldShow) {
    return null;
  }

  const isRunning = snapshot.status === 'RUNNING';
  const isPaused = snapshot.status === 'PAUSED';
  const isAwaiting = snapshot.status === 'AWAITING_NEXT_PHASE';

  const getPhaseTheme = () => {
    if (isPaused) {
      return {
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        dot: 'bg-amber-500',
        bar: 'bg-amber-500',
        label: 'PAUSED',
      };
    }
    if (snapshot.phase === 'FOCUS') {
      return {
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-500 animate-pulse',
        bar: 'bg-emerald-500',
        label: isAwaiting ? 'FOCUS READY' : 'FOCUS',
      };
    }
    if (snapshot.phase === 'LONG_BREAK') {
      return {
        badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        dot: 'bg-indigo-500 animate-pulse',
        bar: 'bg-indigo-500',
        label: isAwaiting ? 'LONG BREAK READY' : 'LONG BREAK',
      };
    }
    return {
      badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
      dot: 'bg-sky-500 animate-pulse',
      bar: 'bg-sky-500',
      label: isAwaiting ? 'BREAK READY' : 'BREAK',
    };
  };

  const theme = getPhaseTheme();
  const timeFormatted = formatDigitalTime(snapshot.remainingSec);
  const progressPercent = Math.min(100, Math.max(0, snapshot.progress * 100));

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }
    : {};

  return (
    <aside
      ref={containerRef}
      role="region"
      aria-label="Floating Pomodoro mini timer"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={style}
      className={`z-50 select-none cursor-grab active:cursor-grabbing transition-shadow ${
        position
          ? 'fixed'
          : 'fixed bottom-6 right-4 sm:right-6'
      } bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden w-64 sm:w-72 animate-slide-up hover:border-emerald-500/40`}
    >
      <div className="p-3 sm:p-3.5 space-y-2">
        {/* Top bar: Phase Tag, Label, and Expand button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${theme.badgeBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
              <span>{theme.label}</span>
            </span>
            {snapshot.label && (
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 truncate">
                {snapshot.label}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleExpand}
            aria-label="Expand Pomodoro to full screen"
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Expand to full screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Time and Controls */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="font-mono text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            {timeFormatted}
          </div>

          <div className="flex items-center gap-1">
            {/* Play / Pause / Start button */}
            {isAwaiting ? (
              <button
                type="button"
                onClick={() => start()}
                aria-label="Start next phase"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-950/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>
            ) : isRunning ? (
              <button
                type="button"
                onClick={() => pause()}
                aria-label="Pause timer"
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-current" />
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={() => resume()}
                aria-label="Resume timer"
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => start()}
                aria-label="Start timer"
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Skip button */}
            <button
              type="button"
              onClick={() => skip()}
              aria-label="Skip current phase"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Skip phase"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini Progress Bar along bottom edge */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${theme.bar}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </aside>
  );
}
