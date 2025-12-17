// ===========================================
// SESSION MANAGER - ORCHESTRATES EVERYTHING
// ===========================================
// Main controller that ties Hume + Professor Carl together
// for real-time voice learning conversations

import { HumeVoiceClient } from './hume-client'
import { ProfessorCarlPersona } from './professor-carl-persona'
import type {
  LearningSession,
  TranscriptEntry,
  EmotionSnapshot,
  SessionReport,
  EmotionData,
  HumeMessage,
  InsightMoment,
  BrandonContext,
} from './types'
import { v4 as uuidv4 } from 'uuid'

export class VoiceLearningSession {
  private hume: HumeVoiceClient
  private carl: ProfessorCarlPersona

  private session: LearningSession
  private lastEmotions: EmotionData | null = null
  private isActive: boolean = false
  private eventCallbacks: {
    onTranscript?: (entry: TranscriptEntry) => void
    onEmotions?: (emotions: EmotionData) => void
    onInsight?: (insight: InsightMoment) => void
    onError?: (error: Error) => void
  } = {}

  constructor() {
    this.hume = new HumeVoiceClient()
    this.carl = new ProfessorCarlPersona()
    this.session = this.createEmptySession()
  }

  private createEmptySession(): LearningSession {
    return {
      id: uuidv4(),
      userId: '',
      startTime: new Date(),
      transcript: [],
      emotionData: [],
      topicsExplored: [],
      insightsMoments: [],
      contextType: 'learning',
    }
  }

  /**
   * Set event callbacks for real-time updates
   */
  setCallbacks(callbacks: {
    onTranscript?: (entry: TranscriptEntry) => void
    onEmotions?: (emotions: EmotionData) => void
    onInsight?: (insight: InsightMoment) => void
    onError?: (error: Error) => void
  }): void {
    this.eventCallbacks = callbacks
  }

  /**
   * Start a new voice learning session
   */
  async start(
    userId: string,
    context: BrandonContext
  ): Promise<{ sessionId: string; success: boolean }> {
    console.log(`[Session] Starting voice session for user: ${userId}`)

    // Initialize session
    this.session = {
      ...this.createEmptySession(),
      userId,
      contextType: context.isDemo ? 'demo' : 'learning',
    }

    try {
      // Initialize Professor Carl with context
      const systemPrompt = this.carl.initializeForBrandon(context)
      console.log('[Session] Professor Carl initialized')

      // Create Hume config with Professor Carl's system prompt
      const configId = await this.hume.createConfig(systemPrompt, 'ITO')
      console.log(`[Session] Hume config created: ${configId}`)

      // Connect to Hume
      await this.hume.connect(configId, {
        onMessage: this.handleHumeMessage.bind(this),
        onEmotions: this.handleEmotions.bind(this),
        onError: this.handleError.bind(this),
        onClose: this.handleClose.bind(this),
      })
      console.log('[Session] Connected to Hume')

      this.isActive = true

      // Get Professor Carl's opening line
      const opening = await this.carl.getOpeningLine()
      await this.hume.sendAssistantMessage(opening)
      this.addToTranscript('carl', opening)
      console.log(`[Session] Opening: "${opening}"`)

      return { sessionId: this.session.id, success: true }
    } catch (error) {
      console.error('[Session] Failed to start:', error)
      this.handleError(error instanceof Error ? error : new Error(String(error)))
      return { sessionId: this.session.id, success: false }
    }
  }

  /**
   * Handle incoming messages from Hume
   */
  private async handleHumeMessage(message: HumeMessage): Promise<void> {
    console.log(`[Session] Hume message type: ${message.type}`)

    if (message.type === 'user_message' && message.message?.content) {
      const userText = message.message.content
      console.log(`[Session] Brandon said: "${userText}"`)

      // Add to transcript
      this.addToTranscript('user', userText, this.lastEmotions || undefined)

      // Track topics if mentioned
      this.trackTopics(userText)

      // Get Professor Carl's response with emotion context
      const response = await this.carl.getResponse(
        userText,
        this.lastEmotions
          ? {
              confidence: this.lastEmotions.confidence,
              nervousness: this.lastEmotions.nervousness,
              confusion: this.lastEmotions.confusion,
              engagement: this.lastEmotions.engagement,
            }
          : undefined
      )
      console.log(`[Session] Carl response: "${response}"`)

      // Check for insight moments
      this.detectInsightMoment(userText, response)

      // Send response through Hume TTS
      await this.hume.sendAssistantMessage(response)
      this.addToTranscript('carl', response)
    }

    if (message.type === 'user_interruption') {
      console.log('[Session] User interrupted')
    }

    if (message.type === 'error') {
      console.error('[Session] Hume error message:', message)
    }
  }

  /**
   * Handle emotion updates from Hume
   */
  private handleEmotions(emotions: EmotionData): void {
    this.lastEmotions = emotions
    this.session.emotionData.push({
      timestamp: new Date(),
      emotions,
    })

    if (this.eventCallbacks.onEmotions) {
      this.eventCallbacks.onEmotions(emotions)
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('[Session Error]', error)
    if (this.eventCallbacks.onError) {
      this.eventCallbacks.onError(error)
    }
  }

  /**
   * Handle connection close
   */
  private handleClose(): void {
    console.log('[Session] Connection closed')
    this.isActive = false
  }

  /**
   * Add entry to transcript
   */
  private addToTranscript(
    speaker: 'user' | 'carl',
    text: string,
    emotions?: EmotionData
  ): void {
    const entry: TranscriptEntry = {
      timestamp: new Date(),
      speaker,
      text,
      emotions,
    }

    this.session.transcript.push(entry)

    if (this.eventCallbacks.onTranscript) {
      this.eventCallbacks.onTranscript(entry)
    }
  }

  /**
   * Track topics mentioned in conversation
   */
  private trackTopics(text: string): void {
    // Simple keyword extraction for topic tracking
    // In production, this could use Claude for smarter extraction
    const topicIndicators = [
      'about',
      'regarding',
      'explore',
      'understand',
      'learn about',
      'working on',
      'thinking about',
    ]

    const lower = text.toLowerCase()
    for (const indicator of topicIndicators) {
      const idx = lower.indexOf(indicator)
      if (idx !== -1) {
        const afterIndicator = text.slice(idx + indicator.length).trim()
        const topic = afterIndicator.split(/[.!?]/)[0].trim()
        if (topic.length > 3 && topic.length < 100) {
          if (!this.session.topicsExplored.includes(topic)) {
            this.session.topicsExplored.push(topic)
          }
        }
      }
    }
  }

  /**
   * Detect insight moments based on emotion shifts and content
   */
  private detectInsightMoment(userText: string, carlResponse: string): void {
    if (!this.lastEmotions) return

    // Insight indicators: sudden engagement spike, joy + surprise
    const isBreakthrough =
      this.lastEmotions.engagement > 0.7 &&
      this.lastEmotions.joy > 0.5 &&
      this.lastEmotions.surprise > 0.4

    const isProgress =
      this.lastEmotions.engagement > 0.5 &&
      this.lastEmotions.confusion < 0.3

    if (isBreakthrough || isProgress) {
      const insight: InsightMoment = {
        timestamp: new Date(),
        topic: this.session.topicsExplored[this.session.topicsExplored.length - 1] || 'General exploration',
        insight: userText.slice(0, 200), // Capture what they said
        emotionState: { ...this.lastEmotions },
        quality: isBreakthrough ? 'breakthrough' : 'progress',
      }

      this.session.insightsMoments.push(insight)

      if (this.eventCallbacks.onInsight) {
        this.eventCallbacks.onInsight(insight)
      }
    }
  }

  /**
   * End the session and generate report
   */
  async end(): Promise<SessionReport> {
    console.log('[Session] Ending session...')

    this.isActive = false
    this.session.endTime = new Date()

    // Disconnect from Hume
    await this.hume.disconnect()

    // Generate comprehensive report
    const report = this.generateReport()

    console.log(`[Session] Report generated. Engagement: ${report.overallEngagement}`)

    // Reset
    this.carl.reset()

    return report
  }

  /**
   * Generate session report
   */
  private generateReport(): SessionReport {
    const duration = this.session.endTime
      ? (this.session.endTime.getTime() - this.session.startTime.getTime()) / 1000
      : 0

    // Calculate average emotions
    const avgConfidence = this.session.emotionData.length > 0
      ? this.session.emotionData.reduce((sum, e) => sum + e.emotions.confidence, 0) / this.session.emotionData.length
      : 0.5

    const avgEngagement = this.session.emotionData.length > 0
      ? this.session.emotionData.reduce((sum, e) => sum + e.emotions.engagement, 0) / this.session.emotionData.length
      : 0.5

    // Find peak confusion moments
    const confusionMoments = this.session.emotionData
      .filter(e => e.emotions.confusion > 0.6)
      .slice(0, 5)
      .map(e => ({
        timestamp: e.timestamp,
        context: `Confusion: ${Math.round(e.emotions.confusion * 100)}%`,
      }))

    // Find breakthrough moments
    const breakthroughMoments = this.session.insightsMoments
      .filter(i => i.quality === 'breakthrough')
      .map(i => ({
        timestamp: i.timestamp,
        context: i.insight.slice(0, 100),
      }))

    // Calculate depth of exploration
    const userMessages = this.session.transcript.filter(t => t.speaker === 'user')
    const avgMessageLength = userMessages.length > 0
      ? userMessages.reduce((sum, t) => sum + t.text.length, 0) / userMessages.length
      : 0

    const depthOfExploration: 'surface' | 'moderate' | 'deep' =
      avgMessageLength > 100 && this.session.topicsExplored.length > 2 ? 'deep' :
      avgMessageLength > 50 || this.session.topicsExplored.length > 1 ? 'moderate' :
      'surface'

    return {
      sessionId: this.session.id,
      duration,
      overallEngagement: avgEngagement,
      emotionAnalysis: {
        averageConfidence: avgConfidence,
        averageEngagement: avgEngagement,
        peakConfusionMoments: confusionMoments,
        breakthroughMoments,
      },
      learningProgress: {
        topicsExplored: this.session.topicsExplored,
        insightsGained: this.session.insightsMoments.length,
        questionsAsked: this.session.transcript.filter(t =>
          t.speaker === 'carl' && t.text.includes('?')
        ).length,
        depthOfExploration,
      },
      feedback: {
        strengths: this.generateStrengths(),
        areasToExplore: this.generateAreasToExplore(),
        suggestedNextTopics: this.generateSuggestedTopics(),
      },
      generatedAt: new Date(),
    }
  }

  private generateStrengths(): string[] {
    const strengths: string[] = []

    if (this.session.insightsMoments.length > 0) {
      strengths.push(`Made ${this.session.insightsMoments.length} insight connections`)
    }
    if (this.session.topicsExplored.length > 1) {
      strengths.push('Explored multiple related topics')
    }
    const avgEngagement = this.session.emotionData.length > 0
      ? this.session.emotionData.reduce((sum, e) => sum + e.emotions.engagement, 0) / this.session.emotionData.length
      : 0
    if (avgEngagement > 0.6) {
      strengths.push('Maintained high engagement throughout')
    }

    if (strengths.length === 0) {
      strengths.push('Completed a productive exploration session')
    }

    return strengths
  }

  private generateAreasToExplore(): string[] {
    const areas: string[] = []

    const confusionMoments = this.session.emotionData.filter(e => e.emotions.confusion > 0.6)
    if (confusionMoments.length > 2) {
      areas.push('Some concepts caused confusion - consider revisiting')
    }

    if (this.session.topicsExplored.length === 1) {
      areas.push('Could explore connections to related topics')
    }

    return areas.length > 0 ? areas : ['Continue exploring at your own pace']
  }

  private generateSuggestedTopics(): string[] {
    // In production, use Claude to generate smart suggestions
    // For now, return generic suggestions based on context
    if (this.session.topicsExplored.length > 0) {
      return [
        `Deeper dive into ${this.session.topicsExplored[0]}`,
        'Connections between explored topics',
        'Practical applications of concepts discussed',
      ]
    }
    return ['Start with any topic you\'re curious about']
  }

  /**
   * Get current session state
   */
  getSessionState(): LearningSession {
    return { ...this.session }
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.isActive
  }

  /**
   * Get live emotion data
   */
  getLastEmotions(): EmotionData | null {
    return this.lastEmotions
  }

  /**
   * Update Professor Carl's context mid-session
   */
  updateContext(updates: Partial<BrandonContext>): void {
    this.carl.updateContext(updates)
  }
}

export default VoiceLearningSession
