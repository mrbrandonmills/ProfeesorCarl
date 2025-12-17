// ===========================================
// CORE TYPES FOR VOICE CONVERSATION SYSTEM
// ===========================================
// Professor Carl + Hume EVI integration for real-time
// voice-based Socratic learning conversations

export interface EmotionData {
  joy: number
  sadness: number
  anger: number
  fear: number
  surprise: number
  disgust: number
  contempt: number
  // Derived metrics for learning adaptation
  confidence: number   // Derived from prosody
  nervousness: number  // Derived from prosody
  confusion: number    // High fear + low confidence
  engagement: number   // High joy + high surprise
}

export interface HumeMessage {
  type: 'user_message' | 'assistant_message' | 'user_interruption' | 'error'
  message?: {
    role: string
    content: string
  }
  models?: {
    prosody?: {
      scores: Record<string, number>
    }
  }
}

export interface HumeConfig {
  id: string
  name: string
}

export interface TranscriptEntry {
  timestamp: Date
  speaker: 'user' | 'carl'
  text: string
  emotions?: EmotionData
}

export interface EmotionSnapshot {
  timestamp: Date
  emotions: EmotionData
}

export interface LearningSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  transcript: TranscriptEntry[]
  emotionData: EmotionSnapshot[]
  topicsExplored: string[]
  insightsMoments: InsightMoment[]
  contextType: 'demo' | 'learning' | 'personal'
}

export interface InsightMoment {
  timestamp: Date
  topic: string
  insight: string
  emotionState: EmotionData
  quality: 'breakthrough' | 'progress' | 'emerging'
}

export interface SessionReport {
  sessionId: string
  duration: number
  overallEngagement: number
  emotionAnalysis: {
    averageConfidence: number
    averageEngagement: number
    peakConfusionMoments: { timestamp: Date; context: string }[]
    breakthroughMoments: { timestamp: Date; context: string }[]
  }
  learningProgress: {
    topicsExplored: string[]
    insightsGained: number
    questionsAsked: number
    depthOfExploration: 'surface' | 'moderate' | 'deep'
  }
  feedback: {
    strengths: string[]
    areasToExplore: string[]
    suggestedNextTopics: string[]
  }
  generatedAt: Date
}

// Brandon-specific context for personalized learning
export interface BrandonContext {
  isDemo: boolean
  presentationMode: boolean
  // Personal learning context
  neurodivergenceAwareness: boolean
  reverseEngineeringApproach: boolean
  aiCollaborationHistory: boolean
  // Session-specific
  currentTopic?: string
  emotionalState?: {
    current: EmotionData
    trend: 'improving' | 'stable' | 'declining'
  }
}

export interface PersonaConfig {
  id: string
  name: string
  systemPrompt: string
  voice: {
    provider: 'HUME_AI'
    name: 'ITO' | 'KORA' | 'DACHER' | 'AURA' | 'FINN'
  }
  emotionAdaptation: {
    onConfusion: string
    onFrustration: string
    onBreakthrough: string
    onEngagement: string
  }
}
