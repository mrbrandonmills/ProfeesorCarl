'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Mic, Square, Volume2, VolumeX } from 'lucide-react'

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

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
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

    // Initialize session
    const initSession = async () => {
      try {
        const response = await fetch('/api/session/start', { method: 'POST' })
        const data = await response.json()
        setSessionId(data.sessionId)

        // Add context-aware greeting message
        const greetingMessage = storedContext
          ? `Hi! I'm Professor Carl. I see you're working on "${JSON.parse(storedContext).materialTitle}" from the lesson "${JSON.parse(storedContext).lessonTitle}". I'll guide you through understanding this material using questions. What would you like to explore?`
          : "Hi! I'm Professor Carl. I don't give direct answers - instead, I'll guide you to discover insights through questions. What would you like to explore today?"

        setMessages([{
          id: '1',
          role: 'assistant',
          content: greetingMessage
        }])
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      const preferences = JSON.parse(localStorage.getItem('preferences') || '{}')
      const voices = window.speechSynthesis.getVoices()

      const voiceMap: Record<string, string> = {
        'alloy': 'Google US English',
        'echo': 'Alex',
        'nova': 'Samantha'
      }

      const selectedVoiceName = voiceMap[preferences.selected_voice] || 'Google US English'
      const voice = voices.find(v => v.name.includes(selectedVoiceName))

      if (voice) {
        utterance.voice = voice
      }

      utterance.rate = 0.9
      utterance.pitch = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)

      speechSynthRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
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
      // Get voice preference from localStorage
      const preferences = JSON.parse(localStorage.getItem('preferences') || '{}')
      const voiceStyle = preferences.selected_voice || 'alloy'

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId,
          voiceStyle,
          lessonContext: lessonContext // Pass lesson context to API
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

      // Use voice preferences already retrieved above
      if (preferences.interaction_mode !== 'text') {
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
        <div className="relative z-10">
          <h1 className="text-3xl font-light bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
            Professor Carl
          </h1>
          <p className="text-sm text-slate-600">
            Your Socratic AI Tutor • Discover through questions
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
                Ask me anything! I'll guide you to the answer through thoughtful questions.
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
                  whileHover={{ opacity: 1 }}
                  className="absolute top-4 right-4"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/50 hover:bg-white border border-slate-200 h-8 w-8 transition-colors"
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
              placeholder="Type your question... or use the mic to speak"
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
