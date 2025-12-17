// ===========================================
// HUME EVI CLIENT - VOICE I/O + EMOTIONS
// ===========================================
// Handles all voice interaction through Hume's EVI
// Replaces OpenAI TTS with integrated voice + emotion system

import { HumeClient } from 'hume'
import type { EmotionData, HumeMessage } from './types'

export class HumeVoiceClient {
  private client: HumeClient
  private socket: any = null
  private configId: string | null = null

  constructor() {
    this.client = new HumeClient({
      apiKey: process.env.HUME_API_KEY!,
      secretKey: process.env.HUME_SECRET_KEY!,
    })
  }

  /**
   * Create a Hume EVI config for Professor Carl
   * This config tells Hume to use Claude as the LLM backend
   */
  async createConfig(systemPrompt: string, voiceName: 'ITO' | 'KORA' | 'DACHER' | 'AURA' | 'FINN' = 'ITO'): Promise<string> {
    try {
      const config = await this.client.empathicVoice.configs.createConfig({
        name: `professor-carl-${Date.now()}`,
        eviVersion: '2',
        prompt: {
          text: systemPrompt,
        },
        voice: {
          provider: 'HUME_AI',
          name: voiceName,
        },
        languageModel: {
          modelProvider: 'ANTHROPIC',
          modelResource: 'claude-sonnet-4-5-20250514' as any,
          temperature: 0.7,
        },
        eventMessages: {
          onNewChat: {
            enabled: true,
            text: '', // Professor Carl handles the greeting
          },
        },
      })

      this.configId = config.id || null
      console.log('[Hume] Created config:', this.configId)
      return config.id || ''
    } catch (error) {
      console.error('[Hume] Failed to create config:', error)
      throw error
    }
  }

  /**
   * Use an existing config by ID
   */
  setConfigId(configId: string): void {
    this.configId = configId
  }

  /**
   * Connect to Hume EVI WebSocket
   */
  async connect(
    configId: string,
    callbacks: {
      onMessage: (message: HumeMessage) => void
      onEmotions: (emotions: EmotionData) => void
      onError: (error: Error) => void
      onClose: () => void
    }
  ): Promise<void> {
    try {
      this.socket = await this.client.empathicVoice.chat.connect({
        configId,
      })

      this.socket.on('message', (message: HumeMessage) => {
        // Extract emotions from prosody if available
        if (message.models?.prosody?.scores) {
          const emotions = this.parseEmotions(message.models.prosody.scores)
          callbacks.onEmotions(emotions)
        }
        callbacks.onMessage(message)
      })

      this.socket.on('error', callbacks.onError)
      this.socket.on('close', callbacks.onClose)

      console.log('[Hume] Connected to EVI')
    } catch (error) {
      console.error('[Hume] Connection failed:', error)
      throw error
    }
  }

  /**
   * Send text to be spoken by Professor Carl
   */
  async sendAssistantMessage(text: string): Promise<void> {
    if (!this.socket) throw new Error('Not connected to Hume')
    await this.socket.sendAssistantInput({ text })
  }

  /**
   * Interrupt the current speech
   */
  async interrupt(): Promise<void> {
    if (!this.socket) throw new Error('Not connected to Hume')
    await this.socket.sendUserInterruption()
  }

  /**
   * Close the connection
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        await this.socket.close()
      } catch (e) {
        // Ignore close errors
      }
      this.socket = null
    }
    console.log('[Hume] Disconnected')
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null
  }

  /**
   * Parse Hume emotion scores into our EmotionData format
   * Includes learning-specific derived metrics
   */
  private parseEmotions(scores: Record<string, number>): EmotionData {
    const joy = scores['Joy'] || 0
    const fear = scores['Fear'] || 0
    const sadness = scores['Sadness'] || 0
    const surprise = scores['Surprise'] || 0
    const confidence = this.calculateConfidence(scores)
    const nervousness = this.calculateNervousness(scores)

    return {
      joy,
      sadness,
      anger: scores['Anger'] || 0,
      fear,
      surprise,
      disgust: scores['Disgust'] || 0,
      contempt: scores['Contempt'] || 0,
      // Derived metrics for learning adaptation
      confidence,
      nervousness,
      // Confusion: high fear + low confidence + frustration indicators
      confusion: this.calculateConfusion(scores),
      // Engagement: high joy + surprise + interest
      engagement: this.calculateEngagement(scores),
    }
  }

  /**
   * Calculate confidence from emotion scores
   * High confidence = low fear, low sadness, high determination
   */
  private calculateConfidence(scores: Record<string, number>): number {
    const fear = scores['Fear'] || 0
    const sadness = scores['Sadness'] || 0
    const determination = scores['Determination'] || 0.5
    const calmness = scores['Calmness'] || 0.5

    return Math.max(0, Math.min(1,
      (determination + calmness) / 2 - (fear * 0.5) - (sadness * 0.3)
    ))
  }

  /**
   * Calculate nervousness from emotion scores
   * High nervousness = anxiety + fear + embarrassment
   */
  private calculateNervousness(scores: Record<string, number>): number {
    const anxiety = scores['Anxiety'] || 0
    const fear = scores['Fear'] || 0
    const embarrassment = scores['Embarrassment'] || 0
    const awkwardness = scores['Awkwardness'] || 0

    return Math.min(1, (anxiety + fear + embarrassment + awkwardness) / 3)
  }

  /**
   * Calculate confusion level for learning adaptation
   * Confusion = high fear + doubt + low concentration
   */
  private calculateConfusion(scores: Record<string, number>): number {
    const fear = scores['Fear'] || 0
    const doubt = scores['Doubt'] || 0
    const concentration = scores['Concentration'] || 0.5
    const confusion = scores['Confusion'] || 0

    return Math.min(1, (fear + doubt + confusion + (1 - concentration)) / 3)
  }

  /**
   * Calculate engagement level for learning tracking
   * Engagement = interest + curiosity + joy + excitement
   */
  private calculateEngagement(scores: Record<string, number>): number {
    const interest = scores['Interest'] || 0
    const curiosity = scores['Curiosity'] || 0
    const joy = scores['Joy'] || 0
    const excitement = scores['Excitement'] || 0

    return Math.min(1, (interest + curiosity + joy + excitement) / 3)
  }

  /**
   * Get available Hume voices
   */
  getAvailableVoices(): string[] {
    return ['ITO', 'KORA', 'DACHER', 'AURA', 'FINN']
  }
}

export default HumeVoiceClient
