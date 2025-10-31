'use client';

import { useState, useEffect } from 'react';
import { isSpeaking, stop, setGlobalSpeechRate, setPreferredVoice, getAvailableVoices } from '../utils/textToSpeech';

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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = getAvailableVoices();
      setAvailableVoices(voices);

      // Set default to first British/English voice if not already set
      if (!selectedVoice && voices.length > 0) {
        const defaultVoice = voices.find(v => v.lang.startsWith('en-GB')) || voices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();

    // Voices might load asynchronously
    if (typeof window !== 'undefined') {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }
  }, [selectedVoice]);

  useEffect(() => {
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

  const handleSpeedChange = (newRate: number) => {
    onSpeechRateChange(newRate);
    setGlobalSpeechRate(newRate);
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    setPreferredVoice(voiceName);
    setShowVoiceSelector(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Voice On/Off Toggle */}
      <button
        onClick={() => onVoiceEnabledChange(!voiceEnabled)}
        className={`p-2 rounded-lg transition-colors ${
          voiceEnabled
            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title={voiceEnabled ? 'Voice ON - Click to disable' : 'Voice OFF - Click to enable'}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
      </button>

      {/* Voice Selector Button */}
      {voiceEnabled && (
        <div className="relative">
          <button
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Choose voice"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 8a3 3 0 11-6 0 3 3 0 016 0zm10 0a3 3 0 11-6 0 3 3 0 016 0zM7 16a3 3 0 11-6 0 3 3 0 016 0zm10 0a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Voice Selector Dropdown */}
          {showVoiceSelector && (
            <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[280px] max-h-[300px] overflow-y-auto">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Voice
              </label>
              <div className="space-y-1">
                {availableVoices.map((voice) => (
                  <button
                    key={voice.name}
                    onClick={() => handleVoiceChange(voice.name)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedVoice === voice.name
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {voice.lang} {voice.localService ? '(Local)' : '(Online)'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speed Control Button */}
      {voiceEnabled && (
        <div className="relative">
          <button
            onClick={() => setShowSpeedControl(!showSpeedControl)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={`Speech speed: ${speechRate.toFixed(1)}x`}
          >
            <span className="text-xs font-medium">{speechRate.toFixed(1)}x</span>
          </button>

          {/* Speed Slider Dropdown */}
          {showSpeedControl && (
            <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Speech Speed: {speechRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechRate}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0.5x (Slower)</span>
                <span>2.0x (Faster)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stop Speaking Button (only show when speaking) */}
      {currentlySpeaking && (
        <button
          onClick={handleStopSpeaking}
          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 transition-colors"
          title="Stop Professor Carl from speaking"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
