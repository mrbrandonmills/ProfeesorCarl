/**
 * Text-to-Speech Utility for Professor Carl
 * Uses Web Speech API with British English voice
 */

// Track current utterance for cleanup and state management
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Get available British English voices
 */
export function getBritishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];

  const voices = window.speechSynthesis.getVoices();

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
 * Speak text using British English voice
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

  // Get British voice
  const voices = getBritishVoices();
  if (voices.length > 0) {
    utterance.voice = voices[0];
  }

  // Configure speech parameters for natural Professor Carl voice
  utterance.rate = 0.95; // Slightly slower for clarity
  utterance.pitch = 1.0; // Natural pitch
  utterance.volume = 1.0;
  utterance.lang = 'en-GB';

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
