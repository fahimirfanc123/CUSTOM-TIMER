import { EngineSnapshot } from '../../core/engine/types';

export interface ProgressDisplayProps {
  snapshot: EngineSnapshot;
}

export function ProgressDisplay({ snapshot }: ProgressDisplayProps) {
  const segment = snapshot.currentSegment;
  const context = segment?.context;

  const currentSet = context?.set ?? 1;
  const totalSets = context?.totalSets ?? 1;
  const currentRound = context?.round ?? 1;
  const totalRounds = context?.totalRounds ?? 1;
  const currentStep = context?.step ?? 1;
  const totalSteps = context?.totalSteps ?? 1;

  const progressPercent = Math.min(100, Math.max(0, Math.round(snapshot.progress * 100)));

  return (
    <div className="w-full space-y-3 select-none">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2 text-center" role="region" aria-label="Workout Progress">
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/90 rounded-xl py-2 px-1 shadow-sm dark:shadow-none">
          <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Set
          </div>
          <div
            className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-mono mt-0.5"
            aria-label={`Set ${currentSet} of ${totalSets}`}
          >
            {currentSet} <span className="text-zinc-400 dark:text-zinc-500 font-medium">/</span> {totalSets}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/90 rounded-xl py-2 px-1 shadow-sm dark:shadow-none">
          <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Round
          </div>
          <div
            className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-mono mt-0.5"
            aria-label={`Round ${currentRound} of ${totalRounds}`}
          >
            {currentRound} <span className="text-zinc-400 dark:text-zinc-500 font-medium">/</span> {totalRounds}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/90 rounded-xl py-2 px-1 shadow-sm dark:shadow-none">
          <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Step
          </div>
          <div
            className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-mono mt-0.5"
            aria-label={`Step ${currentStep} of ${totalSteps}`}
          >
            {currentStep} <span className="text-zinc-400 dark:text-zinc-500 font-medium">/</span> {totalSteps}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-zinc-200 dark:bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-zinc-800/60">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Workout overall progress"
          />
        </div>
      </div>
    </div>
  );
}
