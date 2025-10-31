'use client';

import { useState, useEffect } from 'react';
import { getCurrentVoiceInfo, isSpeaking, stop } from '../utils/textToSpeech';

interface VoiceSettingsProps {
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
}

export default function VoiceSettings({
  voiceEnabled,
  onVoiceEnabledChange,
}: VoiceSettingsProps) {
  const [currentlySpeaking, setCurrentlySpeaking] = useState(false);
  const [voiceInfo, setVoiceInfo] = useState('');

  useEffect(() => {
    // Update voice info
    setVoiceInfo(getCurrentVoiceInfo());

    // Check speaking status periodically
    const interval = setInterval(() => {
      setCurrentlySpeaking(isSpeaking());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleStopSpeaking = () => {
    stop();
    setCurrentlySpeaking(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Voice On/Off Toggle */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="voice-toggle"
          className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
          Voice
        </label>
        <button
          id="voice-toggle"
          onClick={() => onVoiceEnabledChange(!voiceEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            voiceEnabled
              ? 'bg-indigo-600'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
          title={voiceEnabled ? 'Voice ON' : 'Voice OFF'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              voiceEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Stop Speaking Button (only show when speaking) */}
      {currentlySpeaking && (
        <button
          onClick={handleStopSpeaking}
          className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-md flex items-center gap-1 transition-colors"
          title="Stop Professor Carl from speaking"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Stop Speaking
        </button>
      )}

      {/* Voice Info (for debugging, can hide in production) */}
      {voiceInfo && (
        <span className="text-xs text-gray-500 dark:text-gray-400" title={voiceInfo}>
          🎙️ {voiceInfo.includes('GB') ? 'British' : 'English'}
        </span>
      )}
    </div>
  );
}
