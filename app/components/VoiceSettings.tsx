'use client';

import { useState, useEffect } from 'react';
import {
  isSpeaking,
  stop,
  setGlobalSpeechRate,
  getOpenAIVoices,
  setOpenAIVoice,
  getOpenAIVoice
} from '../utils/textToSpeech';

interface VoiceSettingsProps {
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
}

export default function VoiceSettings({
  voiceEnabled,
  onVoiceEnabledChange,
  speechRate,
  onSpeechRateChange,
}: VoiceSettingsProps) {
  const [currentlySpeaking, setCurrentlySpeaking] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('alloy');

  useEffect(() => {
    // Load current OpenAI voice on mount
    const currentVoice = getOpenAIVoice();
    setSelectedVoice(currentVoice);
  }, []);

  useEffect(() => {
    // Check speaking status periodically
    const interval = setInterval(() => {
      setCurrentlySpeaking(isSpeaking());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Close dropdowns if clicking outside
      if (!target.closest('.voice-dropdown')) {
        setShowSpeedControl(false);
        setShowVoiceSelector(false);
      }
    };

    if (showSpeedControl || showVoiceSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSpeedControl, showVoiceSelector]);

  const handleStopSpeaking = () => {
    stop();
    setCurrentlySpeaking(false);
  };

  const handleSpeedChange = (newRate: number) => {
    onSpeechRateChange(newRate);
    setGlobalSpeechRate(newRate);
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setOpenAIVoice(voiceId as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer');
    setShowVoiceSelector(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Voice On/Off Toggle */}
      <button
        onClick={() => onVoiceEnabledChange(!voiceEnabled)}
        className={`p-3 rounded-xl transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center active:scale-95 ${
          voiceEnabled
            ? 'bg-indigo-100 hover:bg-indigo-200 active:bg-indigo-300 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:active:bg-indigo-700 text-indigo-600 dark:text-indigo-300'
            : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-600 dark:text-gray-400'
        }`}
        title={voiceEnabled ? 'Voice ON - Click to disable' : 'Voice OFF - Click to enable'}
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
      </button>

      {/* Voice Selector Button */}
      {voiceEnabled && (
        <div className="relative voice-dropdown">
          <button
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-600 dark:text-gray-400 transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center active:scale-95"
            title="Choose voice"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 8a3 3 0 11-6 0 3 3 0 016 0zm10 0a3 3 0 11-6 0 3 3 0 016 0zM7 16a3 3 0 11-6 0 3 3 0 016 0zm10 0a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Voice Selector Dropdown */}
          {showVoiceSelector && (
            <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[300px] max-h-[400px] overflow-y-auto z-50">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Select Voice (OpenAI HD)
              </label>
              <div className="space-y-2">
                {getOpenAIVoices().map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceChange(voice.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all min-h-[44px] active:scale-98 ${
                      selectedVoice === voice.id
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{voice.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {voice.description}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ✨ High-quality AI voices (same as ChatGPT)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speed Control Button */}
      {voiceEnabled && (
        <div className="relative voice-dropdown">
          <button
            onClick={() => setShowSpeedControl(!showSpeedControl)}
            className="px-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-600 dark:text-gray-400 transition-all min-h-[44px] min-w-[56px] sm:min-h-0 sm:min-w-0 flex items-center justify-center active:scale-95"
            title={`Speech speed: ${speechRate.toFixed(1)}x`}
          >
            <span className="text-sm font-semibold">{speechRate.toFixed(1)}x</span>
          </button>

          {/* Speed Slider Dropdown */}
          {showSpeedControl && (
            <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[240px] z-50">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Speech Speed: {speechRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechRate}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                style={{ minHeight: '44px' }}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stop Speaking Button (only show when speaking) */}
      {currentlySpeaking && (
        <button
          onClick={handleStopSpeaking}
          className="p-3 rounded-xl bg-red-100 hover:bg-red-200 active:bg-red-300 dark:bg-red-900 dark:hover:bg-red-800 dark:active:bg-red-700 text-red-700 dark:text-red-300 transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center active:scale-95 animate-pulse"
          title="Stop Professor Carl from speaking"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
