import React from 'react';
import { FocusPhase, FocusStatus } from '../../core/focus/types';

export interface ProgressRingProps {
  progress: number; // 0.0 to 1.0 (elapsed ratio)
  size?: number;
  strokeWidth?: number;
  phase: FocusPhase;
  status: FocusStatus;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 10,
  phase,
  status,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // strokeDashoffset: progress 0 => offset circumference (empty), progress 1 => offset 0 (full)
  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  const getProgressColor = () => {
    if (status === 'PAUSED') {
      return 'text-amber-500 dark:text-amber-400';
    }
    switch (phase) {
      case 'FOCUS':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'SHORT_BREAK':
        return 'text-sky-500 dark:text-sky-400';
      case 'LONG_BREAK':
        return 'text-indigo-500 dark:text-indigo-400';
      default:
        return 'text-emerald-500 dark:text-emerald-400';
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        aria-hidden="true"
        className="w-full h-full -rotate-90 transform"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-zinc-200 dark:text-zinc-800/80 fill-transparent"
        />
        {/* Animated Progress Indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          className={`fill-transparent transition-all duration-300 ease-out ${getProgressColor()}`}
        />
      </svg>
      {/* Central Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        {children}
      </div>
    </div>
  );
}
