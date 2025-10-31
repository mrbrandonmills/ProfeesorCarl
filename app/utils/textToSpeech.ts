/**
 * Text-to-Speech Utility for Professor Carl
 * Uses Web Speech API with British English voice
 */

// Track current utterance for cleanup and state management
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Global speech rate (adjustable by user, default 0.95x)
let globalSpeechRate = 0.95;

// Preferred voice name (user-selected)
let preferredVoiceName: string | null = null;

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
 * Speak text using selected or British English voice
 */
export function speak(
  text: string,
  onEnd?: () => void,
  onStart?: () => void
): void {
  if (typeof window === 'undefined') return;

  // Stop any current speech
  stop();

  const utterance = new SpeechSynthesisUtterance(text);

  // Get preferred or default voice
  const voice = getVoiceToUse();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang; // Use the voice's language
  } else {
    utterance.lang = 'en-GB'; // Fallback to British English
  }

  // Configure speech parameters for natural Professor Carl voice
  utterance.rate = globalSpeechRate; // User-adjustable speech rate
  utterance.pitch = 1.0; // Natural pitch
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
 * Stop current speech
 */
export function stop(): void {
  if (typeof window === 'undefined') return;

  window.speechSynthesis.cancel();
  currentUtterance = null;
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined') return false;
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
}

/**
 * Get current global speech rate
 */
export function getGlobalSpeechRate(): number {
  return globalSpeechRate;
}
