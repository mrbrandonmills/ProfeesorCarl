'use client';

import { useState, useEffect, useRef } from 'react';

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

export default function VoiceControls({
  onTranscript,
  isListening,
  onListeningChange,
}: VoiceControlsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-GB'; // British English

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }

          if (finalTranscript) {
            onTranscript(finalTranscript.trim());
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech' || event.error === 'aborted') {
            // Silently handle - user just stopped talking
            onListeningChange(false);
          }
        };

        recognitionRef.current.onend = () => {
          if (isListening) {
            // Restart if we want to keep listening
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
              onListeningChange(false);
            }
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
  }, [isListening]);

  const toggleListening = () => {
    onListeningChange(!isListening);
  };

  if (!isSupported) {
    return null; // Hide button if not supported
  }

  return (
    <button
      onClick={toggleListening}
      className={`p-3 rounded-full transition-all ${
        isListening
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
          : 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
      }`}
      title={isListening ? 'Stop listening' : 'Click to speak'}
      type="button"
    >
      {isListening ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
