'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Mic, Square, Volume2, VolumeX, Settings, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface LessonContext {
  lessonId: string
  lessonTitle: string
  objectives: string[]
  materialTitle: string
  materialType: string
}

interface DemoContext {
  isDemo: boolean
  presentationMode?: boolean
  userName?: string
  userRole?: string
  institution?: string
  presentationContext?: string
  specialInstructions?: string[]
  sampleTopics?: string[]
}

const VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Warm and balanced' },
  { id: 'echo', name: 'Echo', description: 'Clear and articulate' },
  { id: 'fable', name: 'Fable', description: 'Expressive storytelling' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'nova', name: 'Nova', description: 'Energetic and youthful' },
  { id: 'shimmer', name: 'Shimmer', description: 'Bright and enthusiastic' },
]

/**
 * Derive memory userId from demo context
 * Transforms "Brandon Mills" → "brandon-mills" for consistent memory lookup
 */
function getMemoryUserId(demoContext: DemoContext | null): string {
  return demoContext?.userName?.toLowerCase().replace(/\s+/g, '-') || 'brandon'
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null)
  const [demoContext, setDemoContext] = useState<DemoContext | null>(null)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('alloy')
  const [voiceSpeed, setVoiceSpeed] = useState(1.0)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const speechSynthRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Check for demo context in sessionStorage
    const storedDemoContext = sessionStorage.getItem('demoContext')
    if (storedDemoContext) {
      try {
        const demo = JSON.parse(storedDemoContext)
        setDemoContext(demo)
        console.log('🎓 Demo mode activated:', demo.userName)
      } catch (error) {
        console.error('Failed to parse demo context:', error)
      }
    }

    // Check for lesson context in sessionStorage
    const storedContext = sessionStorage.getItem('lessonContext')
    if (storedContext) {
      try {
        const context = JSON.parse(storedContext)
        setLessonContext(context)
      } catch (error) {
        console.error('Failed to parse lesson context:', error)
      }
    }

    // Load preferences from localStorage
    const preferences = JSON.parse(localStorage.getItem('preferences') || '{}')
    if (preferences.selected_voice) {
      setSelectedVoice(preferences.selected_voice)
    }
    if (preferences.interaction_mode !== 'text') {
      setAutoSpeak(true)
    }

    // Initialize session
    const initSession = async () => {
      try {
        const response = await fetch('/api/session/start', { method: 'POST' })
        const data = await response.json()
        setSessionId(data.sessionId)

        // Check if demo mode
        const demoCtx = storedDemoContext ? JSON.parse(storedDemoContext) : null

        // Fetch memory status for sync confirmation (affects greeting message)
        let memoryStatus: { totalMemories: number; anchorSyncConnected: boolean; timestamp: string } | null = null
        try {
          const userId = getMemoryUserId(demoCtx)
          const memoryResponse = await fetch(`/api/memory/status?user_id=${userId}`)
          if (memoryResponse.ok) {
            memoryStatus = await memoryResponse.json()
          }
        } catch (e) {
          console.log('Memory status fetch failed (non-critical):', e)
        }

        // Generate context-aware greeting message
        let greetingMessage: string

        if (demoCtx?.isDemo) {
          greetingMessage = `Welcome, ${demoCtx.userName || 'Brandon'}! 🎓

I'm Professor Carl, ready for the ${demoCtx.institution || 'UCSD'} demonstration. I'm here to showcase how AI can enhance learning through the Socratic method.

What would you like to explore? You can:
• Ask me to demonstrate my teaching approach
• Say "tell them about our work" for an overview
• Pick any topic and I'll guide you through it with questions

I'm ready when you are!`
        } else if (storedContext) {
          const ctx = JSON.parse(storedContext)
          greetingMessage = `Hi! I'm Professor Carl. I see you're working on "${ctx.materialTitle}" from the lesson "${ctx.lessonTitle}". I'll guide you through understanding this material using questions. What would you like to explore?`
        } else if (memoryStatus && memoryStatus.totalMemories > 0) {
          // Show memory sync confirmation
          const time = new Date(memoryStatus.timestamp)
          const isValidDate = !isNaN(time.getTime())
          const timeStr = isValidDate
            ? `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`
            : 'now'
          const anchorSync = memoryStatus.anchorSyncConnected ? ' (synced with ANCHOR)' : ''

          greetingMessage = `🧠 **Welcome back! Memory is sharp.**

${memoryStatus.totalMemories} memories synced at ${timeStr}${anchorSync}

I remember our conversations and I'm ready to guide you. What would you like to explore today?`
        } else {
          greetingMessage = "Hi! I'm Professor Carl. I don't give direct answers - instead, I'll guide you to discover insights through questions. What would you like to explore today?"
        }

        setMessages([{
          id: '1',
          role: 'assistant',
          content: greetingMessage
        }])

        // Auto-speak greeting in demo mode
        if (demoCtx?.isDemo && preferences.interaction_mode !== 'text') {
          setTimeout(() => speakText(greetingMessage), 500)
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
      }
    }
    initSession()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Save memories when session ends (unmount or page leave)
  useEffect(() => {
    const saveMemories = async () => {
      if (!sessionId || messages.length < 2) return

      try {
        // Get userId from demo context or auth
        const userId = getMemoryUserId(demoContext)

        await fetch('/api/memory/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            sessionId,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            demoContext,
          }),
        })
        console.log('💾 Memories saved for session:', sessionId)
      } catch (error) {
        console.error('Failed to save memories:', error)
      }
    }

    // Save on page unload
    const handleBeforeUnload = () => {
      if (sessionId && messages.length >= 2) {
        // Use sendBeacon for reliable delivery
        const userId = getMemoryUserId(demoContext)
        navigator.sendBeacon('/api/memory/process', JSON.stringify({
          userId,
          sessionId,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          demoContext,
        }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup: save memories when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      saveMemories()
    }
  }, [sessionId, messages, demoContext])

  const speakText = async (text: string) => {
    try {
      // Stop any currently playing audio
      stopSpeaking()

      setIsSpeaking(true)

      // Call OpenAI TTS API with speed
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
          speed: voiceSpeed,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      // Play the audio
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      // Store reference to current audio for stopping
      speechSynthRef.current = audio as any

      await audio.play()
    } catch (error) {
      console.error('Error speaking text:', error)
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      const audio = speechSynthRef.current as any
      if (audio.pause) {
        audio.pause()
        audio.currentTime = 0
      }
      setIsSpeaking(false)
    }
  }

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId)
    // Save to localStorage
    const preferences = JSON.parse(localStorage.getItem('preferences') || '{}')
    preferences.selected_voice = voiceId
    localStorage.setItem('preferences', JSON.stringify(preferences))
  }

  const handleSpeedChange = (speed: number) => {
    setVoiceSpeed(speed)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId,
          voiceStyle: selectedVoice,
          lessonContext: lessonContext,
          demoContext: demoContext, // Pass demo context to API
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Auto-speak if enabled
      if (autoSpeak) {
        speakText(data.response)
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble responding right now. Could you try again?"
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        const reader = new FileReader()
        reader.onloadend = () => {
          transcribeAudio()
        }
        reader.readAsDataURL(audioBlob)

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }

      recognition.start()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white border border-slate-200 shadow-sm m-6 p-6 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/50 pointer-events-none" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-light bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Professor Carl
              </h1>
              {demoContext?.isDemo && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg shadow-amber-500/30"
                >
                  DEMO MODE
                </motion.span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              {demoContext?.isDemo
                ? `${demoContext.institution} Presentation • ${demoContext.userName}`
                : 'Your Socratic AI Tutor • Discover through questions'
              }
            </p>
            {lessonContext && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex items-center gap-2 text-xs"
              >
                <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                  <span className="text-blue-700 font-medium">📚 {lessonContext.lessonTitle}</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
                  <span className="text-slate-700">{lessonContext.materialTitle}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Voice Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="bg-white/60 hover:bg-white border-slate-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Voice
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showVoiceSettings ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Voice Settings Panel */}
        <AnimatePresence>
          {showVoiceSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-slate-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Voice Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {VOICES.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed Control */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Speed: {voiceSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voiceSpeed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>

                {/* Auto-speak Toggle */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Auto-speak</label>
                  <button
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      autoSpeak
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {autoSpeak ? '🔊 On' : '🔇 Off'}
                  </button>
                </div>
              </div>

              {/* Test Voice Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText("Hello! This is how I'll sound during our conversation.")}
                  disabled={isSpeaking}
                  className="bg-white/60 hover:bg-white"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Test Voice
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 hide-scrollbar">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center h-full"
          >
            <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-2xl max-w-md text-center">
              <div className="text-5xl mb-4">🎓</div>
              <p className="text-slate-600 text-lg leading-relaxed">
                {demoContext?.isDemo
                  ? "Ready for the UCSD demonstration! Ask me anything."
                  : "Ask me anything! I'll guide you to the answer through thoughtful questions."
                }
              </p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                layout: { duration: 0.3 }
              }}
              className="relative group mb-6"
            >
              <MessageBubble role={message.role} content={message.content} />
              {message.role === 'assistant' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-4 right-4"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/80 hover:bg-white border border-slate-200 h-8 w-8 transition-colors shadow-sm"
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-slate-600" />
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Elegant Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start mb-6"
          >
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
              <div className="flex gap-2">
                <motion.div
                  className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white border border-slate-200 shadow-sm m-6 p-6 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex gap-4">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={demoContext?.isDemo
                ? "Try: 'tell them about our work' or ask about any topic..."
                : "Type your question... or use the mic to speak"
              }
              className="resize-none bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 min-h-[60px] transition-all duration-200"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-3">
            {/* Voice Recording Button */}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-[60px] w-[60px] transition-all duration-300 ${
                  isRecording
                    ? 'bg-blue-100 border-blue-400 hover:bg-blue-200 shadow-lg shadow-blue-200/50'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
                variant="outline"
              >
                {isRecording ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Square className="h-5 w-5 text-blue-600" />
                  </motion.div>
                ) : (
                  <Mic className="h-5 w-5 text-slate-600" />
                )}
              </Button>
            </motion.div>

            {/* Send Button */}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`h-[60px] w-[60px] transition-all duration-300 ${
                  !isLoading && input.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 hover:from-blue-700 hover:to-indigo-700 shadow-md'
                    : 'bg-white border-slate-200'
                }`}
                variant="outline"
              >
                <Send className={`h-5 w-5 ${
                  !isLoading && input.trim() ? 'text-white' : 'text-slate-400'
                }`} />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
