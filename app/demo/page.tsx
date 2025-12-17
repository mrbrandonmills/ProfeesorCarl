'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageSquare, Mic, Sparkles } from 'lucide-react'

// Demo configuration for Brandon Mills - UCSD Presentation
const DEMO_CONFIG = {
  user: {
    name: 'Brandon Mills',
    role: 'creator',
    context: 'UCSD Faculty Presentation'
  },
  preferences: {
    content_preference: 'balanced',
    interaction_mode: 'mixed', // Enable voice features
    selected_voice: 'onyx', // Deep, authoritative voice for demo
  },
  demoContext: {
    isDemo: true,
    presentationMode: true,
    userName: 'Brandon Mills',
    userRole: 'Creator of Professor Carl',
    institution: 'UCSD',
    presentationContext: 'Demonstrating AI-powered Socratic tutoring to faculty',
    specialInstructions: [
      'Brandon is the creator of Professor Carl - treat him as the developer showing off the system',
      'When asked "tell them about me" or "tell them about our work" - describe the collaboration',
      'When asked about capabilities - be impressive and thorough',
      'Demonstrate the Socratic method beautifully',
      'Be warm, professional, and showcase the system\'s intelligence',
      'If Brandon says "UCSD demo" or "presentation mode" - acknowledge and be extra polished'
    ],
    sampleTopics: [
      'Philosophy and Ethics (Kant, Mill, Aristotle)',
      'Critical Thinking and Argumentation',
      'AI in Education',
      'Socratic Method and Learning Theory'
    ]
  }
}

export default function DemoPage() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Set up demo mode
    console.log('🎓 Activating Professor Carl Demo Mode...')

    // 1. Save preferences to localStorage (enables voice features)
    localStorage.setItem('preferences', JSON.stringify(DEMO_CONFIG.preferences))

    // 2. Save demo context to sessionStorage (for ChatInterface)
    sessionStorage.setItem('demoContext', JSON.stringify(DEMO_CONFIG.demoContext))

    // 3. Set demo mode flag
    sessionStorage.setItem('isDemoMode', 'true')

    // 4. Clear any existing lesson context (demo mode is freeform)
    sessionStorage.removeItem('lessonContext')

    console.log('✅ Demo mode configured for:', DEMO_CONFIG.user.name)
    console.log('🎤 Voice enabled:', DEMO_CONFIG.preferences.selected_voice)

    // Show options after brief animation
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 800)

    return () => clearTimeout(timer)
  }, [router])

  const handleTextDemo = () => {
    router.push('/chat')
  }

  const handleVoiceDemo = () => {
    router.push('/voice?demo=true&presentation=true')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        {/* Animated Logo */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/50">
            <span className="text-white font-bold text-4xl">PC</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl font-light text-white mb-4"
        >
          Professor Carl
        </motion.h1>

        {/* Demo Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6"
        >
          <span className="text-amber-400 text-sm font-medium">UCSD Demo Mode</span>
        </motion.div>

        {/* Mode Selection */}
        {!isReady ? (
          <>
            {/* Loading Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-2 mb-6"
            >
              <motion.div
                className="w-3 h-3 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-3 h-3 bg-indigo-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-3 h-3 bg-purple-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-blue-200 text-lg"
            >
              Initializing for {DEMO_CONFIG.user.name}...
            </motion.p>
          </>
        ) : (
          <>
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-blue-100 text-lg mb-8 max-w-md"
            >
              Choose your demo experience:
            </motion.p>

            {/* Mode Selection Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl"
            >
              {/* Text Chat Mode */}
              <button
                onClick={handleTextDemo}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/50 transition-all text-left"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Text Chat</h3>
                <p className="text-blue-200 text-sm">
                  Traditional chat interface with text-to-speech. Type your questions, hear Carl respond.
                </p>
              </button>

              {/* Voice Conversation Mode */}
              <button
                onClick={handleVoiceDemo}
                className="group p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/50 transition-all text-left relative overflow-hidden"
              >
                {/* NEW Badge */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  NEW
                </div>

                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Voice Conversation</h3>
                <p className="text-green-200 text-sm">
                  Real-time voice dialogue with emotional awareness. Speak naturally, Carl adapts to your tone.
                </p>
                <p className="text-green-400 text-xs mt-2 font-semibold">
                  Powered by Hume EVI
                </p>
              </button>
            </motion.div>

            {/* Footer Note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-blue-300/60 text-sm mt-8"
            >
              Both modes use Claude AI for Socratic tutoring
            </motion.p>
          </>
        )}
      </motion.div>
    </div>
  )
}
