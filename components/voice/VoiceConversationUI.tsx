'use client'

// ===========================================
// VOICE CONVERSATION UI COMPONENT
// ===========================================
// Real-time voice interface for Professor Carl using Hume EVI

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Phone, PhoneOff, Volume2, Brain, Sparkles, Heart, AlertCircle, Play, Pause, Gauge } from 'lucide-react'
import { VoiceProvider, useVoice } from '@humeai/voice-react'

interface VoiceConversationUIProps {
  userId: string
  isDemo?: boolean
  presentationMode?: boolean
  onSessionEnd?: (report: SessionReport) => void
}

interface SessionReport {
  duration: number
  overallEngagement: number
  emotionAnalysis: {
    averageConfidence: number
    averageEngagement: number
  }
  learningProgress: {
    topicsExplored: string[]
    insightsGained: number
  }
  feedback: {
    strengths: string[]
    areasToExplore: string[]
    suggestedNextTopics: string[]
  }
}

interface EmotionData {
  confidence: number
  engagement: number
  confusion: number
  nervousness: number
  isBreakthrough: boolean // High engagement + joy + surprise = insight moment
}

// Professor Carl Config - Claude Sonnet 4 (Hume's best available Anthropic model)
// Config ID: 52b75fbf-732c-48fe-af7e-5aae177e8136 (your original working config)
// Hume does NOT support Opus - only claude-sonnet-4-20250514

// Inner component that uses the voice hooks
function VoiceConversationInner({
  userId,
  isDemo,
  presentationMode,
  onSessionEnd,
  onVoiceOpen,
  onVoiceError,
  onVoiceClose,
}: {
  userId: string
  isDemo: boolean
  presentationMode: boolean
  onSessionEnd?: (report: SessionReport) => void
  onVoiceOpen?: () => void
  onVoiceError?: (err: unknown) => void
  onVoiceClose?: () => void
}) {
  const {
    connect,
    disconnect,
    status,
    isMuted,
    mute,
    unmute,
    messages,
    error: voiceError,
    sendSessionSettings,
    // Pause/Resume for presentation mode
    pauseAssistant,
    resumeAssistant,
    isPaused,
    // Tool response for memory integration
    sendToolMessage,
  } = useVoice()

  const [sessionDuration, setSessionDuration] = useState(0)
  const [liveEmotions, setLiveEmotions] = useState<EmotionData | null>(null)
  const [report, setReport] = useState<SessionReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [displayStatus, setDisplayStatus] = useState('Ready to connect with Professor Carl')
  const [error, setError] = useState<string | null>(null)
  const [configId, setConfigId] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [suggestedVideos, setSuggestedVideos] = useState<{id: string, title: string, thumbnailUrl: string}[]>([])
  const [lastVideoTopic, setLastVideoTopic] = useState<string>('')
  const [voiceSpeed, setVoiceSpeed] = useState(1.0)
  const voiceSpeedRef = useRef(1.0)

  const emotionHistoryRef = useRef<EmotionData[]>([])
  const startTimeRef = useRef<number>(0)
  const sessionIdRef = useRef<string>('')

  // Memory system status
  const [memoryStatus, setMemoryStatus] = useState<string>('')

  // Handle Hume EVI tool calls - route to memory APIs
  const handleToolCall = useCallback(async (toolCallMessage: any) => {
    const { name, parameters, tool_call_id } = toolCallMessage
    console.log('[Memory] Tool call received:', name, parameters, 'for user:', userId)

    try {
      let responseContent = ''

      if (name === 'retrieve_memory') {
        const params = JSON.parse(parameters || '{}')
        const res = await fetch(`/api/memory?user_id=${encodeURIComponent(userId)}&query=${encodeURIComponent(params.query || '')}&types=${params.types || 'all'}&limit=${params.limit || 5}`)
        const result = await res.json()

        if (result.memories?.length > 0) {
          responseContent = result.memories.map((m: any) =>
            `[${m.source}] ${m.data?.content || m.content}`
          ).join('\n')
        } else {
          responseContent = 'No relevant memories found.'
        }
      }

      if (name === 'save_insight') {
        const params = JSON.parse(parameters || '{}')
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: params.insight_type?.includes('user') || params.insight_type?.includes('brandon') ? 'user' : 'carl',
            content: params.content,
            category: params.insight_type,
            sessionId: sessionIdRef.current,
          }),
        })
        const result = await res.json()
        responseContent = result.success ? 'Insight saved.' : 'Failed to save.'
      }

      if (name === 'get_conversation_context') {
        const params = JSON.parse(parameters || '{}')
        const res = await fetch(`/api/memory/context?user_id=${encodeURIComponent(userId)}&topic=${encodeURIComponent(params.topic || '')}&depth=${params.depth || 'standard'}`)
        const result = await res.json()

        const parts: string[] = []
        if (result.context?.userFacts?.length > 0) {
          parts.push('About this user: ' + result.context.userFacts.map((f: any) => f.fact).join('; '))
        }
        if (result.context?.carlMemories?.length > 0) {
          parts.push('Your memories: ' + result.context.carlMemories.map((m: any) => m.memory).join('; '))
        }
        responseContent = parts.length > 0 ? parts.join('\n\n') : 'No prior context yet.'
      }

      // Send tool response back to Hume
      if (sendToolMessage && tool_call_id) {
        sendToolMessage({
          type: 'tool_response',
          toolCallId: tool_call_id,
          content: responseContent,
        } as any)
        console.log('[Memory] Sent response:', responseContent.substring(0, 100))
      }

      setMemoryStatus(`Memory: ${name}`)
      setTimeout(() => setMemoryStatus(''), 2000)

    } catch (err) {
      console.error('[Memory] Tool error:', err)
      if (sendToolMessage && toolCallMessage.tool_call_id) {
        sendToolMessage({
          type: 'tool_response',
          toolCallId: toolCallMessage.tool_call_id,
          content: 'Memory unavailable.',
        } as any)
      }
    }
  }, [sendToolMessage, userId])

  // Listen for tool_call messages from Hume
  useEffect(() => {
    if (!messages || messages.length === 0) return
    const lastMsg = messages[messages.length - 1] as any

    if (lastMsg?.type === 'tool_call') {
      handleToolCall(lastMsg)
    }
  }, [messages, handleToolCall])

  // Professor Carl config with British voice - Sonnet 4 (Hume's best available)
  useEffect(() => {
    // Your original working config from Hume dashboard
    const PROFESSOR_CARL_CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136'
    console.log('[Voice] Using Professor Carl config:', PROFESSOR_CARL_CONFIG_ID)
    setConfigId(PROFESSOR_CARL_CONFIG_ID)
    setConfigLoading(false)
  }, [])

  // Voice speed control - patches Web Audio API to apply playback rate
  useEffect(() => {
    voiceSpeedRef.current = voiceSpeed
    console.log('[Voice] Speed changed to:', voiceSpeed)
  }, [voiceSpeed])

  // Patch AudioBufferSourceNode to apply our speed on playback
  useEffect(() => {
    const originalStart = AudioBufferSourceNode.prototype.start
    const patchedStart = function(this: AudioBufferSourceNode, ...args: Parameters<typeof originalStart>) {
      // Apply the current voice speed before starting playback
      this.playbackRate.value = voiceSpeedRef.current
      return originalStart.apply(this, args)
    }
    AudioBufferSourceNode.prototype.start = patchedStart

    return () => {
      // Restore original on unmount
      AudioBufferSourceNode.prototype.start = originalStart
    }
  }, [])

  const isConnected = status.value === 'connected'

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isConnected) {
      interval = setInterval(() => {
        setSessionDuration((d) => d + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isConnected])

  // Update status based on voice status
  useEffect(() => {
    switch (status.value) {
      case 'disconnected':
        if (!report) setDisplayStatus('Ready to connect with Professor Carl')
        break
      case 'connecting':
        setDisplayStatus('Connecting to Professor Carl...')
        break
      case 'connected':
        setDisplayStatus('Connected - Speak with Professor Carl')
        break
      case 'error':
        setDisplayStatus('Connection error')
        break
    }
  }, [status.value, report])

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      console.error('[Voice] Error:', voiceError)
      setError(voiceError.message || 'An error occurred')
    }
  }, [voiceError])

  // Fetch YouTube videos for a topic
  const fetchVideosForTopic = useCallback(async (topic: string) => {
    if (!topic || topic === lastVideoTopic) return
    try {
      const response = await fetch(`/api/videos/search?topic=${encodeURIComponent(topic)}&limit=3`)
      if (response.ok) {
        const data = await response.json()
        if (data.videos && data.videos.length > 0) {
          setSuggestedVideos(data.videos)
          setLastVideoTopic(topic)
          console.log('[Voice] Found videos for:', topic, data.videos.length)
        }
      }
    } catch (err) {
      console.error('[Voice] Video search error:', err)
    }
  }, [lastVideoTopic])

  // Detect when Carl mentions videos and extract topic
  useEffect(() => {
    const lastMessage = messages[messages.length - 1] as any
    if (lastMessage?.type === 'assistant_message') {
      const text = (lastMessage.message?.content || '').toLowerCase()
      // Check if Carl is offering to find a video
      if (text.includes('video') && (text.includes('find') || text.includes('show') || text.includes('shall i'))) {
        // Extract topic from recent context - use words before "video" or after common patterns
        const topicMatch = text.match(/(?:about|on|for|regarding)\s+([^.!?]+?)(?:\s+video|\?|$)/i)
        if (topicMatch && topicMatch[1]) {
          fetchVideosForTopic(topicMatch[1].trim())
        }
      }
    }
  }, [messages, fetchVideosForTopic])

  // Process messages for emotions
  useEffect(() => {
    const lastMessage = messages[messages.length - 1] as any
    if (lastMessage) {
      // Debug: Log all message types to see what Hume sends
      console.log('[Voice] Message received:', lastMessage.type, lastMessage)
    }

    // Check for prosody in different locations (Hume SDK varies)
    const prosodyScores = lastMessage?.prosody?.scores
      || lastMessage?.models?.prosody?.scores
      || lastMessage?.emotion?.scores
      || null

    if (lastMessage && prosodyScores) {
      const scores = prosodyScores as Record<string, number>
      console.log('[Voice] Emotion scores found:', scores)

      // Calculate derived metrics
      const engagement = Math.min(1,
        ((scores['Interest'] || 0) + (scores['Curiosity'] || 0) + (scores['Joy'] || 0) + (scores['Excitement'] || 0)) / 3
      )
      const joy = scores['Joy'] || 0
      const surprise = scores['Surprise'] || 0

      const emotions: EmotionData = {
        confidence: Math.max(0, Math.min(1,
          ((scores['Determination'] || 0.5) + (scores['Calmness'] || 0.5)) / 2 - (scores['Fear'] || 0) * 0.3
        )),
        engagement,
        confusion: Math.min(1,
          ((scores['Fear'] || 0) + (scores['Doubt'] || 0) + (scores['Confusion'] || 0)) / 2
        ),
        nervousness: Math.min(1,
          ((scores['Anxiety'] || 0) + (scores['Fear'] || 0) + (scores['Embarrassment'] || 0)) / 2
        ),
        // Breakthrough moment: high engagement + joy + surprise = insight!
        isBreakthrough: engagement > 0.7 && joy > 0.5 && surprise > 0.3,
      }
      setLiveEmotions(emotions)
      emotionHistoryRef.current.push(emotions)
    }
  }, [messages])

  // Start session with timeout wrapper
  const startSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    emotionHistoryRef.current = []
    startTimeRef.current = Date.now()
    // Generate session ID for memory tracking
    sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('[Memory] Session ID:', sessionIdRef.current)

    const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY
    console.log('[Voice] Starting session, API key present:', !!apiKey)
    console.log('[Voice] Config ID:', configId)

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection timed out after 15 seconds. Please check your internet connection and try again.'))
      }, 15000)
    })

    try {
      console.log('[Voice] Calling connect()...')

      // Build connection options
      const connectOptions: Parameters<typeof connect>[0] = {
        auth: { type: 'apiKey', value: apiKey || '' },
      }

      // Add configId if available (for custom voice and LLM settings)
      if (configId) {
        connectOptions.configId = configId
        console.log('[Voice] Using custom config:', configId)
      }

      // Race between connect and timeout
      await Promise.race([
        connect(connectOptions),
        timeoutPromise
      ])

      console.log('[Voice] Connected successfully!')
      // Config ID already contains the full Professor Carl prompt - no need to override

      setSessionDuration(0)
    } catch (err) {
      console.error('[Voice] Start error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to start voice session')
      }
    } finally {
      setIsLoading(false)
    }
  }, [connect, sendSessionSettings, configId])

  // End session
  const endSession = useCallback(async () => {
    setIsLoading(true)
    setDisplayStatus('Generating your session insights...')

    try {
      disconnect()

      // Generate report with real emotion analytics
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const emotions = emotionHistoryRef.current

      const avgConfidence = emotions.length > 0
        ? emotions.reduce((sum, e) => sum + e.confidence, 0) / emotions.length
        : 0.5

      const avgEngagement = emotions.length > 0
        ? emotions.reduce((sum, e) => sum + e.engagement, 0) / emotions.length
        : 0.5

      const avgNervousness = emotions.length > 0
        ? emotions.reduce((sum, e) => sum + e.nervousness, 0) / emotions.length
        : 0

      // Count actual breakthrough/insight moments
      const breakthroughCount = emotions.filter(e => e.isBreakthrough).length

      // Generate dynamic feedback based on actual metrics
      const strengths: string[] = []
      if (avgEngagement > 0.6) strengths.push('Maintained excellent engagement throughout')
      if (avgConfidence > 0.6) strengths.push('Showed strong confidence in responses')
      if (breakthroughCount > 0) strengths.push(`Had ${breakthroughCount} breakthrough insight moment${breakthroughCount > 1 ? 's' : ''}`)
      if (avgNervousness < 0.3) strengths.push('Stayed calm and focused')
      if (strengths.length === 0) strengths.push('Completed a learning session')

      const areasToExplore: string[] = []
      if (avgNervousness > 0.4) areasToExplore.push('Practice relaxation techniques before sessions')
      if (avgConfidence < 0.4) areasToExplore.push('Build confidence through more exploration')
      if (avgEngagement < 0.4) areasToExplore.push('Try topics you find more personally interesting')
      if (areasToExplore.length === 0) areasToExplore.push('Continue exploring topics of interest')

      const sessionReport: SessionReport = {
        duration,
        overallEngagement: avgEngagement,
        emotionAnalysis: {
          averageConfidence: avgConfidence,
          averageEngagement: avgEngagement,
        },
        learningProgress: {
          topicsExplored: ['General exploration'],
          insightsGained: breakthroughCount, // Real insight count, not placeholder!
        },
        feedback: {
          strengths,
          areasToExplore,
          suggestedNextTopics: ['Deeper dive into discussed concepts'],
        },
      }

      setReport(sessionReport)
      setDisplayStatus('Session complete')
      onSessionEnd?.(sessionReport)
    } catch (err) {
      console.error('[Voice] End error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [disconnect, onSessionEnd])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      unmute()
    } else {
      mute()
    }
  }, [isMuted, mute, unmute])

  // Toggle pause (for presentation mode - pause Carl to address audience)
  // Added debounce to prevent glitchy rapid toggles
  const [isPauseTransitioning, setIsPauseTransitioning] = useState(false)
  const togglePause = useCallback(() => {
    if (isPauseTransitioning) return // Prevent rapid toggles

    setIsPauseTransitioning(true)
    try {
      if (isPaused) {
        resumeAssistant()
        console.log('[Voice] Resuming Carl...')
      } else {
        pauseAssistant()
        console.log('[Voice] Pausing Carl...')
      }
    } catch (err) {
      console.error('[Voice] Pause/resume error:', err)
    }

    // Allow next toggle after 500ms debounce
    setTimeout(() => setIsPauseTransitioning(false), 500)
  }, [isPaused, pauseAssistant, resumeAssistant, isPauseTransitioning])

  // Reset for new session
  const resetSession = useCallback(() => {
    setReport(null)
    setSessionDuration(0)
    setLiveEmotions(null)
    setError(null)
    setVoiceSpeed(1.0)
    voiceSpeedRef.current = 1.0
    emotionHistoryRef.current = []
    setDisplayStatus('Ready to connect with Professor Carl')
  }, [])

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Emotion color mapping
  const getEmotionColor = (value: number) => {
    if (value > 0.7) return 'text-green-400'
    if (value > 0.4) return 'text-yellow-400'
    return 'text-slate-400'
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Floating Animation Keyframes */}
      <style jsx global>{`
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 60px rgba(99, 102, 241, 0.3), 0 0 120px rgba(99, 102, 241, 0.15); }
          50% { box-shadow: 0 0 80px rgba(99, 102, 241, 0.4), 0 0 160px rgba(99, 102, 241, 0.25); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .liquid-glass {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
            0 40px 80px -20px rgba(99, 102, 241, 0.3);
        }
        .liquid-glass-dark {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1.5px solid rgba(99, 102, 241, 0.3);
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(99, 102, 241, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            0 40px 80px -20px rgba(99, 102, 241, 0.4);
        }
        .float-animation {
          animation: subtleFloat 6s ease-in-out infinite;
        }
        .glow-pulse {
          animation: pulseGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Header with Glass Effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          {isDemo ? 'Professor Carl - Demo Mode' : 'Voice Conversation'}
        </h1>
        <p className="text-slate-600">
          {isDemo
            ? 'Real-time voice dialogue with emotional awareness'
            : 'Speak naturally with Professor Carl'}
        </p>
      </motion.div>

      {/* Status Bar - Liquid Glass */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-4 rounded-2xl mb-6 transition-all duration-500 ${
          error
            ? 'bg-red-500/10 border border-red-400/30 backdrop-blur-xl'
            : isConnected
            ? 'liquid-glass-dark glow-pulse'
            : 'liquid-glass'
        }`}
        style={{
          background: error
            ? 'rgba(239, 68, 68, 0.1)'
            : isConnected
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))'
            : 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {error && <AlertCircle className="w-5 h-5 text-red-400" />}
            <p className={error ? 'text-red-300' : isConnected ? 'text-green-300' : 'text-slate-300'}>
              {error || displayStatus}
            </p>
          </div>
          {isConnected && (
            <span className="text-green-400 font-mono font-bold text-lg">
              {formatDuration(sessionDuration)}
            </span>
          )}
        </div>
      </motion.div>

      {/* ========== PRE-SESSION ========== */}
      {!isConnected && !report && (
        <div className="space-y-6">
          {/* Info Card - Floating Liquid Glass */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="float-animation relative overflow-hidden p-8 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.1))',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1.5px solid rgba(99, 102, 241, 0.25)',
              boxShadow: `
                0 30px 60px -15px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
                0 50px 100px -30px rgba(99, 102, 241, 0.4),
                0 0 150px rgba(99, 102, 241, 0.15)
              `,
            }}
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at top left, rgba(99, 102, 241, 0.15), transparent 60%)',
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1)',
                    boxShadow: '0 10px 40px -10px rgba(99, 102, 241, 0.5)',
                  }}
                >
                  <Brain className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Professor Carl</h2>
                  <p className="text-slate-600">Your AI Socratic Learning Partner</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(99, 102, 241, 0.1)' }}
                >
                  <Mic className="w-5 h-5 text-indigo-500" />
                  <span className="text-slate-700">Real-time voice conversation</span>
                </motion.div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(236, 72, 153, 0.1)' }}
                >
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span className="text-slate-700">Emotional awareness & adaptation</span>
                </motion.div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(245, 158, 11, 0.1)' }}
                >
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="text-slate-700">Personalized Socratic questioning</span>
                </motion.div>
              </div>

              <p className="text-sm text-slate-500">
                {isDemo
                  ? 'This demo showcases real-time AI voice dialogue with emotional tracking.'
                  : 'Speak naturally and explore any topic through guided questions.'}
              </p>
            </div>
          </motion.div>

          {/* Start Button - Glass Effect */}
          <motion.button
            onClick={startSession}
            disabled={isLoading || status.value === 'connecting' || configLoading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 text-white rounded-2xl font-bold text-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #10b981, #22c55e)',
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s ease infinite',
              boxShadow: `
                0 20px 40px -10px rgba(34, 197, 94, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.2),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.3)
              `,
            }}
          >
            {configLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing Professor Carl...
              </>
            ) : isLoading || status.value === 'connecting' ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="w-6 h-6" />
                Start Voice Session
              </>
            )}
          </motion.button>

          {/* Config status indicator */}
          {!configLoading && configId && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm mt-3 px-4 py-2 rounded-full mx-auto w-fit"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
              }}
            >
              ✓ Professor Carl configured (British voice)
            </motion.p>
          )}
        </div>
      )}

      {/* ========== ACTIVE SESSION ========== */}
      {isConnected && (
        <div className="space-y-6">
          {/* Active Session Card - Floating Liquid Glass */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="float-animation relative overflow-hidden p-8 rounded-3xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.08), rgba(34, 197, 94, 0.1))',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1.5px solid rgba(34, 197, 94, 0.3)',
              boxShadow: `
                0 30px 60px -15px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
                0 50px 100px -30px rgba(34, 197, 94, 0.35),
                0 0 120px rgba(34, 197, 94, 0.2)
              `,
            }}
          >
            {/* Animated gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(34, 197, 94, 0.15), transparent 70%)',
              }}
            />

            {/* Pulsing Indicator - Enhanced */}
            <div className="mb-6 relative z-10">
              <div className="relative mx-auto w-28 h-28">
                {/* Outer glow rings */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4), transparent 70%)' }}
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3), transparent 70%)' }}
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #10b981)',
                    boxShadow: `
                      0 20px 50px -10px rgba(34, 197, 94, 0.5),
                      inset 0 2px 0 0 rgba(255, 255, 255, 0.3)
                    `,
                  }}
                >
                  <Volume2 className="w-14 h-14 text-white drop-shadow-lg" />
                </motion.div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">
              Session Active
            </h2>
            <p className="text-slate-600 mb-1 relative z-10">Speaking with Professor Carl</p>
            <p className="text-lg font-mono font-bold mb-6 relative z-10" style={{ color: '#22c55e' }}>
              {formatDuration(sessionDuration)}
            </p>

            {/* Live Emotion Display */}
            <AnimatePresence>
              {liveEmotions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 mb-6"
                >
                  {/* Breakthrough indicator */}
                  {liveEmotions.isBreakthrough && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 rounded-full py-2 px-4 mx-auto w-fit"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Insight Moment!</span>
                    </motion.div>
                  )}

                  {/* Main metrics */}
                  <div className="flex justify-center gap-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getEmotionColor(liveEmotions.confidence)}`}>
                        {Math.round(liveEmotions.confidence * 100)}%
                      </div>
                      <div className="text-xs text-slate-500">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getEmotionColor(liveEmotions.engagement)}`}>
                        {Math.round(liveEmotions.engagement * 100)}%
                      </div>
                      <div className="text-xs text-slate-500">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getEmotionColor(1 - liveEmotions.confusion)}`}>
                        {Math.round((1 - liveEmotions.confusion) * 100)}%
                      </div>
                      <div className="text-xs text-slate-500">Clarity</div>
                    </div>
                    {/* Show nervousness only when elevated */}
                    {liveEmotions.nervousness > 0.3 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
                          {Math.round(liveEmotions.nervousness * 100)}%
                        </div>
                        <div className="text-xs text-slate-500">Nervous</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* YouTube Video Suggestions */}
            {suggestedVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200"
              >
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <span>Related Videos</span>
                  <button
                    onClick={() => setSuggestedVideos([])}
                    className="ml-auto text-xs text-slate-400 hover:text-slate-600"
                  >
                    Dismiss
                  </button>
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {suggestedVideos.slice(0, 3).map((video) => (
                    <a
                      key={video.id}
                      href={`https://youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-36 group"
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 group-hover:text-blue-600">
                        {video.title}
                      </p>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Control Buttons: Mute + Pause */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${
                  isMuted
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Pause Button - for addressing audience */}
              <button
                onClick={togglePause}
                disabled={isPauseTransitioning}
                className={`p-3 rounded-full transition-all ${
                  isPauseTransitioning
                    ? 'bg-gray-200 text-gray-400 cursor-wait'
                    : isPaused
                    ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={isPauseTransitioning ? 'Please wait...' : isPaused ? 'Resume Carl' : 'Pause Carl to address audience'}
              >
                {isPauseTransitioning ? (
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : isPaused ? (
                  <Play className="w-6 h-6" />
                ) : (
                  <Pause className="w-6 h-6" />
                )}
              </button>
            </div>

            <p className="text-sm text-slate-500">
              {isPaused
                ? 'Carl is paused. Click play to resume conversation.'
                : isMuted
                  ? 'Microphone muted'
                  : 'Your microphone is active. Speak naturally.'}
            </p>

            {/* Voice Speed Control */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Gauge className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600 font-medium">Voice Speed</span>
                <span className="text-sm font-mono font-bold text-blue-600">{voiceSpeed}x</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setVoiceSpeed(speed)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      voiceSpeed === speed
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                {voiceSpeed < 1 ? 'Slower pace for complex topics' :
                 voiceSpeed > 1 ? 'Faster for quick review' :
                 'Normal speaking pace'}
              </p>
            </div>
          </motion.div>

          {/* End Session Button - Glass Effect */}
          <motion.button
            onClick={endSession}
            disabled={isLoading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 text-white rounded-2xl font-bold text-lg
                       flex items-center justify-center gap-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f43f5e, #ef4444)',
              boxShadow: `
                0 20px 40px -10px rgba(239, 68, 68, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.15),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.2)
              `,
            }}
          >
            {isLoading ? 'Generating Insights...' : (
              <>
                <PhoneOff className="w-5 h-5" />
                End Session
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* ========== SESSION REPORT ========== */}
      {report && (
        <div className="space-y-6">
          {/* Overall Score - Floating Liquid Glass */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="float-animation relative overflow-hidden p-8 rounded-3xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.1))',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1.5px solid rgba(168, 85, 247, 0.25)',
              boxShadow: `
                0 30px 60px -15px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
                0 50px 100px -30px rgba(168, 85, 247, 0.35),
                0 0 120px rgba(168, 85, 247, 0.15)
              `,
            }}
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(168, 85, 247, 0.15), transparent 70%)',
              }}
            />

            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent relative z-10">
              Session Insights
            </h2>

            <div className="mb-8 relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-36 h-36 rounded-full"
                style={{
                  background: report.overallEngagement >= 0.7
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))'
                    : report.overallEngagement >= 0.4
                    ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(245, 158, 11, 0.1))'
                    : 'linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(100, 116, 139, 0.1))',
                  border: `4px solid ${
                    report.overallEngagement >= 0.7 ? 'rgba(34, 197, 94, 0.5)'
                    : report.overallEngagement >= 0.4 ? 'rgba(234, 179, 8, 0.5)'
                    : 'rgba(148, 163, 184, 0.5)'
                  }`,
                  boxShadow: report.overallEngagement >= 0.7
                    ? '0 20px 50px -10px rgba(34, 197, 94, 0.4)'
                    : report.overallEngagement >= 0.4
                    ? '0 20px 50px -10px rgba(234, 179, 8, 0.4)'
                    : '0 20px 50px -10px rgba(148, 163, 184, 0.4)',
                }}
              >
                <span className="text-5xl font-bold text-slate-800">
                  {Math.round(report.overallEngagement * 100)}%
                </span>
              </motion.div>
              <p className="mt-4 text-slate-600 font-medium">Overall Engagement</p>
            </div>

            {/* Stats Grid - Glass Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 relative z-10">
              {[
                { value: `${Math.round(report.emotionAnalysis.averageConfidence * 100)}%`, label: 'Confidence', color: '#6366f1' },
                { value: report.learningProgress.insightsGained, label: 'Insights', color: '#a855f7' },
                { value: report.learningProgress.topicsExplored.length, label: 'Topics', color: '#f59e0b' },
                { value: formatDuration(report.duration), label: 'Duration', color: '#64748b' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <div className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Detailed Feedback - Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative overflow-hidden p-6 rounded-2xl space-y-6"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Strengths */}
            {report.feedback.strengths.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#22c55e' }}>
                  ✨ Session Highlights
                </h3>
                <ul className="space-y-2">
                  {report.feedback.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-slate-700 pl-4 py-2 rounded-lg"
                      style={{
                        borderLeft: '3px solid rgba(34, 197, 94, 0.5)',
                        background: 'rgba(34, 197, 94, 0.05)',
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas to Explore */}
            {report.feedback.areasToExplore.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#6366f1' }}>
                  🔍 Continue Exploring
                </h3>
                <ul className="space-y-2">
                  {report.feedback.areasToExplore.map((s, i) => (
                    <li
                      key={i}
                      className="text-slate-700 pl-4 py-2 rounded-lg"
                      style={{
                        borderLeft: '3px solid rgba(99, 102, 241, 0.5)',
                        background: 'rgba(99, 102, 241, 0.05)',
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Topics */}
            {report.feedback.suggestedNextTopics.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#a855f7' }}>
                  🚀 Suggested Next Steps
                </h3>
                <ul className="space-y-2">
                  {report.feedback.suggestedNextTopics.map((s, i) => (
                    <li
                      key={i}
                      className="text-slate-700 pl-4 py-2 rounded-lg"
                      style={{
                        borderLeft: '3px solid rgba(168, 85, 247, 0.5)',
                        background: 'rgba(168, 85, 247, 0.05)',
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* Action Buttons - Glass Effect */}
          <div className="space-y-3">
            <motion.button
              onClick={resetSession}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 text-white rounded-2xl font-bold text-lg relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1)',
                boxShadow: `
                  0 20px 40px -10px rgba(99, 102, 241, 0.4),
                  0 0 0 1px rgba(255, 255, 255, 0.2),
                  inset 0 1px 0 0 rgba(255, 255, 255, 0.3)
                `,
              }}
            >
              Start New Session
            </motion.button>

            {/* Exit Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={() => window.location.href = isDemo ? '/demo' : '/'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#475569',
                }}
              >
                {isDemo ? 'Back to Demo Menu' : 'Exit to Home'}
              </motion.button>
              {isDemo && (
                <motion.button
                  onClick={() => window.location.href = '/'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-xl font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#475569',
                  }}
                >
                  Exit to Home
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main component with VoiceProvider wrapper
export default function VoiceConversationUI({
  userId,
  isDemo = false,
  presentationMode = false,
  onSessionEnd,
}: VoiceConversationUIProps) {
  const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY
  const [connectionDebug, setConnectionDebug] = useState<string[]>([])

  const handleOpen = useCallback(() => {
    console.log('[VoiceProvider] onOpen - WebSocket connected!')
    setConnectionDebug(prev => [...prev, `${new Date().toISOString()} - WebSocket opened`])
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('[VoiceProvider] onError:', err)
    setConnectionDebug(prev => [...prev, `${new Date().toISOString()} - Error: ${JSON.stringify(err)}`])
  }, [])

  const handleClose = useCallback(() => {
    console.log('[VoiceProvider] onClose - WebSocket closed')
    setConnectionDebug(prev => [...prev, `${new Date().toISOString()} - WebSocket closed`])
  }, [])

  if (!apiKey) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Configuration Error</h2>
          <p className="text-red-600">
            Hume API key is not configured. Please add NEXT_PUBLIC_HUME_API_KEY to your environment variables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <VoiceProvider
      onOpen={handleOpen}
      onError={handleError}
      onClose={handleClose}
    >
      <VoiceConversationInner
        userId={userId}
        isDemo={isDemo}
        presentationMode={presentationMode}
        onSessionEnd={onSessionEnd}
        onVoiceOpen={handleOpen}
        onVoiceError={handleError}
        onVoiceClose={handleClose}
      />
      {/* Debug panel - visible in dev */}
      {connectionDebug.length > 0 && (
        <div className="max-w-2xl mx-auto mt-4 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
          <strong>Connection Debug:</strong>
          {connectionDebug.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      )}
    </VoiceProvider>
  )
}
