/**
 * Text-to-Speech Utility for Professor Carl
 * Uses OpenAI TTS API (premium quality) with browser TTS fallback
 */

// Track current audio for cleanup and state management
let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Global speech rate (adjustable by user, default 0.95x)
let globalSpeechRate = 0.95;

// Preferred voice name (for browser TTS fallback)
let preferredVoiceName: string | null = null;

// Use OpenAI TTS (true) or browser TTS (false)
let useOpenAITTS = true;

// OpenAI voice selection (alloy, echo, fable, onyx, nova, shimmer)
let openAIVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy';

/**
 * Get all available voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Get available British English voices (for default selection)
 */
export function getBritishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];

  const voices = getAvailableVoices();

  // Prefer voices in this order:
  // 1. UK English voices (en-GB)
  // 2. English voices with "British" in name
  // 3. Any English voice

  const ukVoices = voices.filter(v => v.lang.startsWith('en-GB'));
  const britishVoices = voices.filter(v =>
    v.name.toLowerCase().includes('british') ||
    v.name.toLowerCase().includes('uk') ||
    v.name.toLowerCase().includes('daniel') || // Common UK voice name
    v.name.toLowerCase().includes('serena')    // Common UK voice name
  );
  const englishVoices = voices.filter(v => v.lang.startsWith('en-'));

  if (ukVoices.length > 0) return ukVoices;
  if (britishVoices.length > 0) return britishVoices;
  return englishVoices;
}

/**
 * Set preferred voice by name
 */
export function setPreferredVoice(voiceName: string): void {
  preferredVoiceName = voiceName;
}

/**
 * Get the voice to use (preferred or default British)
 */
function getVoiceToUse(): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();

  // Try to find preferred voice
  if (preferredVoiceName) {
    const preferred = voices.find(v => v.name === preferredVoiceName);
    if (preferred) return preferred;
  }

  // Fall back to British voices
  const britishVoices = getBritishVoices();
  return britishVoices.length > 0 ? britishVoices[0] : null;
}

/**
 * Speak text using OpenAI TTS (with browser TTS fallback)
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
 * Speak using OpenAI TTS API
 */
async function speakWithOpenAI(
  text: string,
  onEnd?: () => void,
  onStart?: () => void
): Promise<void> {
  // Call our API endpoint to generate speech
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: openAIVoice }),
  });

  if (!response.ok) {
    throw new Error(`TTS API failed: ${response.status}`);
  }

  // Get audio blob
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  // Create audio element
  const audio = new Audio(audioUrl);
  audio.playbackRate = globalSpeechRate; // Apply user's speed setting

  // Set up event listeners
  audio.onloadeddata = () => {
    if (onStart) onStart();
  };

  audio.onended = () => {
    URL.revokeObjectURL(audioUrl); // Clean up
    currentAudio = null;
    if (onEnd) onEnd();
  };

  audio.onerror = (error) => {
    console.error('Audio playback error:', error);
    URL.revokeObjectURL(audioUrl);
    currentAudio = null;
    if (onEnd) onEnd();
  };

  // Play audio
  currentAudio = audio;
  await audio.play();
}

/**
 * Speak using browser TTS (fallback)
 */
function speakWithBrowser(
  text: string,
  onEnd?: () => void,
  onStart?: () => void
): void {
  const utterance = new SpeechSynthesisUtterance(text);

  // Get preferred or default voice
  const voice = getVoiceToUse();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-GB';
  }

  // Configure speech parameters
  utterance.rate = globalSpeechRate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

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
 * Stop current speech (both OpenAI and browser TTS)
 */
export function stop(): void {
  if (typeof window === 'undefined') return;

  // Stop OpenAI audio if playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Stop browser TTS if playing
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

/**
 * Check if currently speaking (both OpenAI and browser TTS)
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined') return false;

  // Check OpenAI audio
  if (currentAudio && !currentAudio.paused) {
    return true;
  }

  // Check browser TTS
  return window.speechSynthesis.speaking;
}

/**
 * Initialize voices (call on mount to ensure voices are loaded)
 */
export function initVoices(callback?: () => void): void {
  if (typeof window === 'undefined') return;

  // Voices may not be loaded immediately
  if (window.speechSynthesis.getVoices().length > 0) {
    if (callback) callback();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      if (callback) callback();
    }, { once: true });
  }
}

/**
 * Get current voice info for debugging
 */
export function getCurrentVoiceInfo(): string {
  const voices = getBritishVoices();
  if (voices.length === 0) return 'No British voice available';

  const voice = voices[0];
  return `${voice.name} (${voice.lang})`;
}

/**
 * Set global speech rate (0.5 = slow, 1.0 = normal, 2.0 = fast)
 */
export function setGlobalSpeechRate(rate: number): void {
  globalSpeechRate = Math.max(0.5, Math.min(2.0, rate)); // Clamp between 0.5 and 2.0

  // Also update currently playing audio if any
  if (currentAudio) {
    currentAudio.playbackRate = globalSpeechRate;
  }
}

/**
 * Get current global speech rate
 */
export function getGlobalSpeechRate(): number {
  return globalSpeechRate;
}

/**
 * Set OpenAI voice (alloy, echo, fable, onyx, nova, shimmer)
 */
export function setOpenAIVoice(
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
): void {
  openAIVoice = voice;
}

/**
 * Get current OpenAI voice
 */
export function getOpenAIVoice(): string {
  return openAIVoice;
}

/**
 * Toggle between OpenAI TTS and browser TTS
 */
export function setUseOpenAITTS(use: boolean): void {
  useOpenAITTS = use;
}

/**
 * Check if using OpenAI TTS
 */
export function isUsingOpenAITTS(): boolean {
  return useOpenAITTS;
}

/**
 * Get available OpenAI voices
 */
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
