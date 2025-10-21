'use client';

import { useState } from 'react';

interface Hint {
  tier: number;
  title: string;
  content: string;
  icon: string;
}

interface HintStepperProps {
  hints: Hint[];
}

export default function HintStepper({ hints }: HintStepperProps) {
  const [revealedTiers, setRevealedTiers] = useState<number[]>([1]); // Show first hint by default

  const revealNextHint = () => {
    const nextTier = Math.max(...revealedTiers) + 1;
    if (nextTier <= hints.length) {
      setRevealedTiers([...revealedTiers, nextTier]);
    }
  };

  const isRevealed = (tier: number) => revealedTiers.includes(tier);
  const hasMoreHints = Math.max(...revealedTiers) < hints.length;

  return (
    <div className="my-4 border border-indigo-200 dark:border-indigo-800 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-indigo-600 dark:bg-indigo-700 px-4 py-2 text-white font-semibold text-sm">
        💡 Hint Stepper - Progressive Scaffolding
      </div>

      {/* Hints */}
      <div className="p-4 space-y-3">
        {hints.map((hint) => (
          <div
            key={hint.tier}
            className={`border rounded-lg transition-all duration-300 ${
              isRevealed(hint.tier)
                ? 'border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 shadow-sm'
                : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50'
            }`}
          >
            {isRevealed(hint.tier) ? (
              // Revealed hint
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{hint.icon}</span>
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">
                    Hint {hint.tier}: {hint.title}
                  </h3>
                </div>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {hint.content}
                </div>
              </div>
            ) : (
              // Locked hint
              <div className="p-4 flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Hint {hint.tier}:</span> {hint.title}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Show Next Hint Button */}
        {hasMoreHints && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={revealNextHint}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <span>Show Next Hint</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Completion Message */}
        {!hasMoreHints && hints.length > 1 && (
          <div className="pt-2 text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            ✅ All hints revealed - Now it&apos;s your turn to try!
          </div>
        )}
      </div>
    </div>
  );
}
