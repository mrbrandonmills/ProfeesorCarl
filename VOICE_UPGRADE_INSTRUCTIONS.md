# OpenAI TTS Voice Upgrade Instructions

**For: Sales Agent AI (or any other AI project)**
**From: Professor Carl voice implementation**
**Date: 2025-10-31**

---

## Overview

This document contains complete instructions to upgrade an AI chat application with premium OpenAI TTS (Text-to-Speech) voices - the same quality as ChatGPT.

### What This Upgrade Provides

- 🎙️ **Premium AI Voices** - ChatGPT-quality speech (not robotic browser voices)
- 🗣️ **6 Voice Options** - Alloy, Echo, Fable, Onyx, Nova, Shimmer
- ⚡ **Speed Control** - 0.5x to 2.0x playback speed
- 🎤 **Speech-to-Text** - Voice input (browser Web Speech API)
- 🛡️ **Smart Fallback** - Auto-fallback to browser TTS if OpenAI fails
- 💰 **Cost Effective** - ~$5-20/month ($15 per 1M characters)

---

## Prerequisites

### 1. Required API Keys

You'll need TWO separate API keys:

**A) Anthropic API Key (for Claude AI responses)**
```
ANTHROPIC_API_KEY=sk-ant-api03-xjsdDFMF4MN5c18Zj2_zt...
```
*Note: You likely already have this configured*

**B) OpenAI API Key (for TTS voices - NEW)**
```
OPENAI_API_KEY=sk-proj-...YOUR_OPENAI_API_KEY_HERE...
```

**🔑 Where to find YOUR ACTUAL KEY:**
- Already provided to you separately (check your secure notes/messages)
- Starts with: `sk-proj-J0nWetQH8LS...`
- ⚠️ Do NOT commit this to git
- Store it securely in Vercel environment variables only

**Where to get OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "TTS Voice" or similar
4. Copy the key (starts with `sk-proj-`)

### 2. Project Requirements

- Next.js 13+ (App Router)
- React 18+
- TypeScript
- Existing chat/AI interface

---

## Implementation Steps

### Step 1: Install OpenAI SDK

Add to `package.json` dependencies:

```json
{
  "dependencies": {
    "openai": "^4.73.0"
  }
}
```

Then run:
```bash
npm install
```

---

### Step 2: Create OpenAI TTS API Route

**File:** `app/api/tts/route.ts` (CREATE NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Configuration
const MODEL = 'tts-1'; // Fast and cheap ($15 per 1M chars)
const DEFAULT_VOICE = 'alloy';

export async function POST(req: NextRequest) {
  try {
    const { text, voice = DEFAULT_VOICE } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Validate voice
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : DEFAULT_VOICE;

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: MODEL,
      voice: selectedVoice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      speed: 1.0, // Speed is controlled on client-side with HTML5 Audio API
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
```

---

### Step 3: Create/Update Text-to-Speech Utility

**File:** `app/utils/textToSpeech.ts` (CREATE or REPLACE)

```typescript
// Track current audio instances for cleanup
let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Global settings
let globalSpeechRate = 0.95; // Default speed
let preferredVoiceName: string | null = null; // For browser TTS fallback
let useOpenAITTS = true; // Primary mode
let openAIVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy';

/**
 * Main speak function with OpenAI TTS + browser fallback
 */
export async function speak(
  text: string,
  onEnd?: () => void,
  onStart?: () => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  // Stop any current speech
  stop();

  // Try OpenAI TTS first
  if (useOpenAITTS) {
    try {
      await speakWithOpenAI(text, onEnd, onStart);
      return;
    } catch (error) {
      console.warn('OpenAI TTS failed, falling back to browser TTS:', error);
      // Fall through to browser TTS
    }
  }

  // Fallback to browser TTS
  speakWithBrowser(text, onEnd, onStart);
}

/**
 * OpenAI TTS Implementation (Premium quality)
 */
async function speakWithOpenAI(
  text: string,
  onEnd?: () => void,
  onStart?: () => void
): Promise<void> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: openAIVoice }),
  });

  if (!response.ok) {
    throw new Error(`TTS API failed: ${response.status}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  // Apply speed setting
  audio.playbackRate = globalSpeechRate;

  audio.onloadeddata = () => {
    if (onStart) onStart();
  };

  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
    currentAudio = null;
    if (onEnd) onEnd();
  };

  audio.onerror = (error) => {
    console.error('Audio playback error:', error);
    URL.revokeObjectURL(audioUrl);
    currentAudio = null;
    if (onEnd) onEnd();
  };

  currentAudio = audio;
  await audio.play();
}

/**
 * Browser TTS Implementation (Fallback)
 */
function speakWithBrowser(
  text: string,
  onEnd?: () => void,
  onStart?: () => void
): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = globalSpeechRate;
  utterance.lang = 'en-GB'; // British English

  if (preferredVoiceName) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.name === preferredVoiceName);
    if (voice) utterance.voice = voice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (error) => {
    console.error('Speech synthesis error:', error);
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop all speech (OpenAI + Browser)
 */
export function stop(): void {
  // Stop OpenAI audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Stop browser TTS
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return !!(currentAudio && !currentAudio.paused) || window.speechSynthesis.speaking;
}

/**
 * Set global speech rate (0.5 - 2.0)
 */
export function setGlobalSpeechRate(rate: number): void {
  globalSpeechRate = Math.max(0.5, Math.min(2.0, rate));

  // Update current OpenAI audio if playing
  if (currentAudio) {
    currentAudio.playbackRate = globalSpeechRate;
  }

  // Browser TTS rate will apply to next utterance
}

export function getGlobalSpeechRate(): number {
  return globalSpeechRate;
}

/**
 * OpenAI Voice Management
 */
export function setOpenAIVoice(
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
): void {
  openAIVoice = voice;
}

export function getOpenAIVoice(): string {
  return openAIVoice;
}

export function getOpenAIVoices(): Array<{
  id: string;
  name: string;
  description: string;
}> {
  return [
    { id: 'alloy', name: 'Alloy', description: 'Neutral, clear voice' },
    { id: 'echo', name: 'Echo', description: 'Male, professional' },
    { id: 'fable', name: 'Fable', description: 'British accent, expressive' },
    { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
    { id: 'nova', name: 'Nova', description: 'Warm, engaging' },
    { id: 'shimmer', name: 'Shimmer', description: 'Friendly, conversational' },
  ];
}

/**
 * Browser TTS Voice Management (Fallback)
 */
export function setPreferredVoice(voiceName: string): void {
  preferredVoiceName = voiceName;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices();
}

export function getBritishVoices(): SpeechSynthesisVoice[] {
  const voices = getAvailableVoices();
  return voices.filter(
    (voice) => voice.lang.startsWith('en-GB') || voice.lang.startsWith('en-UK')
  );
}
```

---

### Step 4: Create Voice Settings Component

**File:** `app/components/VoiceSettings.tsx` (CREATE NEW)

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  isSpeaking,
  stop,
  setGlobalSpeechRate,
  getGlobalSpeechRate,
  getOpenAIVoices,
  setOpenAIVoice,
  getOpenAIVoice,
} from '../utils/textToSpeech';

export default function VoiceSettings() {
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [selectedVoice, setSelectedVoice] = useState('alloy');

  // Load current settings on mount
  useEffect(() => {
    setSpeechRate(getGlobalSpeechRate());
    setSelectedVoice(getOpenAIVoice());
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.voice-settings-container')) {
        setShowSpeedControl(false);
        setShowVoiceSelector(false);
      }
    };

    if (showSpeedControl || showVoiceSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSpeedControl, showVoiceSelector]);

  const handleSpeedChange = (value: number) => {
    setSpeechRate(value);
    setGlobalSpeechRate(value);
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setOpenAIVoice(voiceId as any);
    setShowVoiceSelector(false);
  };

  return (
    <div className="voice-settings-container relative inline-flex items-center gap-2">
      {/* Stop Speaking Button (shown when speaking) */}
      {isSpeaking() && (
        <button
          onClick={stop}
          className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="Stop Speaking"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <rect x="6" y="6" width="8" height="8" />
          </svg>
        </button>
      )}

      {/* Speed Control Toggle */}
      <button
        onClick={() => {
          setShowSpeedControl(!showSpeedControl);
          setShowVoiceSelector(false);
        }}
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title="Speech Speed"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 11V9h4v2H8z" />
        </svg>
      </button>

      {/* Speed Control Dropdown */}
      {showSpeedControl && (
        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 z-50">
          <label className="block text-sm font-medium mb-2">
            Speed: {speechRate.toFixed(2)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speechRate}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
        </div>
      )}

      {/* Voice Selector Toggle */}
      <button
        onClick={() => {
          setShowVoiceSelector(!showVoiceSelector);
          setShowSpeedControl(false);
        }}
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title="Voice Selection"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
        </svg>
      </button>

      {/* Voice Selector Dropdown */}
      {showVoiceSelector && (
        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 w-72 max-h-96 overflow-y-auto z-50">
          <h3 className="font-medium mb-2 text-sm">Select Voice</h3>
          <div className="space-y-1">
            {getOpenAIVoices().map((voice) => (
              <button
                key={voice.id}
                onClick={() => handleVoiceChange(voice.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedVoice === voice.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="font-medium text-sm">{voice.name}</div>
                <div className="text-xs opacity-75">{voice.description}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t">
            ✨ High-quality AI voices (same as ChatGPT)
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### Step 5: Create Voice Input Component (Speech-to-Text)

**File:** `app/components/VoiceInput.tsx` (CREATE NEW)

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

export default function VoiceInput({
  onTranscript,
  isListening,
  onListeningChange,
}: VoiceInputProps) {
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

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

          // Clear previous silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Auto-stop after 2 seconds of silence
          silenceTimerRef.current = setTimeout(() => {
            onListeningChange(false);
          }, 2000);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        onListeningChange(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if still supposed to be listening
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Failed to restart recognition:', error);
            onListeningChange(false);
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    } else {
      recognitionRef.current.stop();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    }
  }, [isListening]);

  if (!isSupported) return null;

  return (
    <button
      onClick={() => onListeningChange(!isListening)}
      className={`p-2 rounded-lg transition-colors ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      title={isListening ? 'Stop Listening' : 'Start Voice Input'}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3a3 3 0 00-3 3v4a3 3 0 006 0V6a3 3 0 00-3-3zm5 7a5 5 0 01-10 0H3a7 7 0 0014 0h-2z" />
      </svg>
    </button>
  );
}
```

---

### Step 6: Integrate Components into Chat Interface

Update your main chat component to include voice features:

```typescript
'use client';

import { useState } from 'react';
import VoiceSettings from './components/VoiceSettings';
import VoiceInput from './components/VoiceInput';
import { speak } from './utils/textToSpeech';

export default function ChatInterface() {
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState('');

  const handleVoiceTranscript = (text: string) => {
    setInput((prev) => prev + ' ' + text);
  };

  const handleSendMessage = async () => {
    // Your existing message sending logic...

    // After getting AI response:
    const aiResponse = "..."; // Your AI response

    // Auto-speak the response
    speak(aiResponse);
  };

  return (
    <div className="chat-interface">
      {/* Your existing chat UI */}

      {/* Voice Controls (place near input area) */}
      <div className="flex items-center gap-2">
        <VoiceInput
          onTranscript={handleVoiceTranscript}
          isListening={isListening}
          onListeningChange={setIsListening}
        />
        <VoiceSettings />
      </div>
    </div>
  );
}
```

---

### Step 7: Add Environment Variables

**Option A: Vercel (Recommended)**

1. Go to your Vercel project dashboard
2. Navigate to: **Settings** → **Environment Variables**
3. Add the following:

```
Name: OPENAI_API_KEY
Value: [Use the actual key from Prerequisites section above]
Environment: Production, Preview, Development
```

4. Click **Save**
5. Redeploy your application

**Option B: Local Development**

Add to `.env.local`:

```bash
OPENAI_API_KEY=[Use the actual key from Prerequisites section above]
```

---

### Step 8: Update System Prompt (If Applicable)

If your AI has a system prompt that describes its capabilities, update it to acknowledge voice features:

```markdown
**IMPORTANT - Voice Capabilities:**
You HAVE text-to-speech voice capabilities. When users ask you to use your voice or speak:
- Acknowledge that you can speak (voice mode is available)
- Encourage them to turn on voice mode if they haven't already
- Continue the conversation naturally - voice mode will read your responses aloud

Never say you're "text-based only" or that you don't have voice capabilities.
```

---

## Testing

### 1. Test OpenAI TTS API

```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test of the OpenAI TTS system.","voice":"alloy"}' \
  --output test.mp3

# Play the audio file
open test.mp3  # macOS
# or
xdg-open test.mp3  # Linux
```

### 2. Test in Browser

1. Open your application
2. Click the microphone icon - speak something
3. Verify transcript appears in input
4. Send a message
5. AI response should auto-play with voice
6. Click speaker icon - select different voices
7. Adjust speed slider - verify speed changes
8. Click stop button - verify speech stops

### 3. Verify Fallback

Temporarily break the API (change API key to invalid) and verify:
- Browser TTS takes over automatically
- No errors displayed to user
- Voice still works (just different quality)

---

## Cost Estimation

**OpenAI TTS Pricing:**
- Model: `tts-1`
- Cost: **$15 per 1,000,000 characters**

**Typical Usage:**
- Average response: ~500 characters
- Cost per response: **$0.0075** (less than 1 cent)
- 100 conversations/day ≈ $0.75/day ≈ **$22.50/month**
- 30 conversations/day ≈ $0.23/day ≈ **$6.90/month**

**Budget Protection:**
You can add rate limiting in the API route if needed:

```typescript
// In app/api/tts/route.ts
const requestCounts = new Map<string, number>();

export async function POST(req: NextRequest) {
  const ip = req.ip || 'unknown';
  const count = requestCounts.get(ip) || 0;

  if (count > 100) { // 100 requests per hour
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  requestCounts.set(ip, count + 1);
  setTimeout(() => requestCounts.delete(ip), 3600000); // Reset after 1 hour

  // ... rest of TTS logic
}
```

---

## Voice Recommendations by Use Case

**Sales Agent:**
- **Onyx** - Deep, authoritative (builds trust)
- **Echo** - Professional male voice
- **Nova** - Warm, engaging (friendly sales approach)

**Customer Support:**
- **Alloy** - Neutral, clear (professional)
- **Shimmer** - Friendly, conversational

**Educational (like Professor Carl):**
- **Fable** - British accent, expressive
- **Nova** - Warm, engaging

**Technical/Professional:**
- **Echo** - Male, professional
- **Onyx** - Deep, authoritative

---

## Troubleshooting

### "Failed to generate speech" Error

**Causes:**
1. Invalid/missing API key
2. Insufficient OpenAI credits
3. Network/firewall issues

**Solutions:**
- Check Vercel environment variables
- Verify API key at https://platform.openai.com/api-keys
- Check OpenAI account balance: https://platform.openai.com/usage

### Voice Not Playing

**Check:**
1. Browser console for errors
2. Network tab - verify `/api/tts` returns audio
3. Audio permissions in browser
4. Volume/mute settings

### Fallback to Browser Voice

If you hear robotic voice instead of AI voice:
- Check browser console for errors
- Verify API key is set correctly
- Test API endpoint directly (see Testing section)

---

## Summary Checklist

- [ ] Install `openai` npm package
- [ ] Create `/app/api/tts/route.ts`
- [ ] Create `/app/utils/textToSpeech.ts`
- [ ] Create `/app/components/VoiceSettings.tsx`
- [ ] Create `/app/components/VoiceInput.tsx`
- [ ] Add components to chat interface
- [ ] Add `OPENAI_API_KEY` to Vercel environment variables
- [ ] Update system prompt (if applicable)
- [ ] Test all voice features
- [ ] Monitor costs in OpenAI dashboard

---

## API Keys Reference

```bash
# For Vercel Environment Variables:

# Claude AI (brain) - already have this
ANTHROPIC_API_KEY=sk-ant-api03-xjsdDFMF4MN5c18Zj2_zt...

# OpenAI TTS (voice) - ADD THIS NEW ONE
OPENAI_API_KEY=[See actual key in Prerequisites section above]
```

---

**Implementation completed in Professor Carl:** Commit `63255ee` on branch `claude/scaffold-socratic-tutor-011CUKA6ejajx3M5xtidehmW`

**Questions?** Reference the Professor Carl codebase or check OpenAI TTS docs: https://platform.openai.com/docs/guides/text-to-speech
