import React, { useState, useEffect } from 'react';

interface BlockTimerProps {
  isRunning: boolean;
  startTime: number | null;
  expectedDiffType: string;
  onComplete: () => void;
}

const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const BlockTimer: React.FC<BlockTimerProps> = ({
  isRunning,
  startTime,
  expectedDiffType,
  onComplete,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(BLOCK_DURATION_MS);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isRunning || !startTime) {
      setTimeRemaining(BLOCK_DURATION_MS);
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, BLOCK_DURATION_MS - elapsed);
      const progressPct = (remaining / BLOCK_DURATION_MS) * 100;

      setTimeRemaining(remaining);
      setProgress(progressPct);

      if (remaining === 0) {
        onComplete();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime, onComplete]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isRunning) {
    return (
      <div className="block-timer border-2 border-gray-300 rounded p-4 text-center">
        <div className="text-gray-500 font-mono">No active block</div>
        <div className="text-sm text-gray-400 mt-2">
          Start a 30-minute block to begin work
        </div>
      </div>
    );
  }

  const isWarning = progress < 25;
  const isCritical = progress < 10;

  return (
    <div className={`block-timer border-2 rounded p-4 ${
      isCritical ? 'border-red-600 bg-red-50' :
      isWarning ? 'border-yellow-500 bg-yellow-50' :
      'border-green-500 bg-green-50'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <div className="font-mono font-bold text-2xl">
          {formatTime(timeRemaining)}
        </div>
        <div className="text-sm uppercase tracking-wide font-semibold">
          {expectedDiffType}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical ? 'bg-red-600' :
            isWarning ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-gray-600 font-mono">
        {isCritical && 'FINAL MINUTES: Produce the diff NOW'}
        {isWarning && !isCritical && 'TIME RUNNING OUT: Focus on output'}
        {!isWarning && 'Block active: Produce a visible diff'}
      </div>
    </div>
  );
};
