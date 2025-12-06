'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Check, ChevronLeft } from 'lucide-react'

const VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Warm and friendly', voiceName: 'Google US English' },
  { id: 'echo', name: 'Echo', description: 'Clear and professional', voiceName: 'Alex' },
  { id: 'nova', name: 'Nova', description: 'Energetic and engaging', voiceName: 'Samantha' },
]

const VOICE_PREVIEW_TEXT = "Hi! I'm Professor Carl. I help students learn through guided questions and discovery."

const contentOptions = [
  {
    id: 'video-heavy',
    icon: '🎥',
    title: 'Visual Learner',
    description: 'Video demonstrations and visual aids',
    gradient: 'from-purple-500/20 to-blue-500/20',
  },
  {
    id: 'balanced',
    icon: '📚',
    title: 'Balanced Approach',
    description: 'Mix of videos, text, and interactive content',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'text-heavy',
    icon: '✍️',
    title: 'Reading Focus',
    description: 'In-depth written explanations and articles',
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
]

const interactionOptions = [
  {
    id: 'text',
    icon: '💬',
    title: 'Type Messages',
    description: 'Traditional text-based interaction',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    id: 'dictate',
    icon: '🎤',
    title: 'Voice Input',
    description: 'Speak your questions and thoughts',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    id: 'mixed',
    icon: '🔄',
    title: 'Flexible Mix',
    description: 'Switch between typing and speaking',
    gradient: 'from-rose-500/20 to-orange-500/20',
  },
]

export function PreferenceQuiz() {
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState({
    content_preference: '',
    interaction_mode: '',
    selected_voice: '',
  })
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Load existing preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Try to load from database first (if authenticated)
        const response = await fetch('/api/preferences')
        if (response.ok) {
          const { preferences: dbPreferences } = await response.json()
          if (dbPreferences) {
            setPreferences({
              content_preference: dbPreferences.content_preference,
              interaction_mode: dbPreferences.interaction_mode,
              selected_voice: dbPreferences.selected_voice,
            })
            // If all preferences exist, skip to chat
            if (dbPreferences.content_preference && dbPreferences.interaction_mode && dbPreferences.selected_voice) {
              window.location.href = '/chat'
              return
            }
          }
        }
      } catch (error) {
        console.log('Not authenticated or no preferences found')
      }

      // Fallback to localStorage
      const stored = localStorage.getItem('preferences')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setPreferences(parsed)
          // If all preferences exist, skip to chat
          if (parsed.content_preference && parsed.interaction_mode && parsed.selected_voice) {
            window.location.href = '/chat'
            return
          }
        } catch (e) {
          console.error('Failed to parse stored preferences')
        }
      }

      setLoading(false)
    }

    loadPreferences()
  }, [])

  const previewVoice = (voiceName: string, voiceId: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(VOICE_PREVIEW_TEXT)
      const voices = window.speechSynthesis.getVoices()
      const voice = voices.find(v => v.name.includes(voiceName))

      if (voice) {
        utterance.voice = voice
      }

      utterance.rate = 0.9
      utterance.pitch = 1.0

      utterance.onstart = () => setPlayingVoice(voiceId)
      utterance.onend = () => setPlayingVoice(null)

      window.speechSynthesis.speak(utterance)
    }
  }

  const handleNext = (value: string) => {
    setSelectedOption(value)
    setTimeout(() => {
      if (step === 1) {
        setPreferences({ ...preferences, content_preference: value })
      } else if (step === 2) {
        setPreferences({ ...preferences, interaction_mode: value })
      }
      setStep(step + 1)
      setSelectedOption('')
    }, 300)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleComplete = async (voiceId: string) => {
    window.speechSynthesis.cancel()
    const finalPreferences = { ...preferences, selected_voice: voiceId }

    // Save to localStorage as backup
    localStorage.setItem('preferences', JSON.stringify(finalPreferences))

    // Save to database if authenticated
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPreferences)
      })

      if (response.ok) {
        console.log('Preferences saved to database')
      }
    } catch (error) {
      console.error('Failed to save preferences to database:', error)
      // Continue anyway - localStorage will serve as backup
    }

    window.location.href = '/chat'
  }

  // Show loading state while checking preferences
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-12 rounded-3xl"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-600">Loading your preferences...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl"
      >
        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-10 relative overflow-hidden">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 pointer-events-none" />

          {/* Header with back button */}
          <div className="relative z-10 flex items-center justify-between mb-8">
            {step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="bg-white/60 hover:bg-white/80 border border-slate-200/50 text-slate-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div className="flex-1" />
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Content Preference */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10"
              >
                <h2 className="text-4xl font-light mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  How do you learn best?
                </h2>
                <p className="text-slate-600 text-lg mb-10">
                  Help us personalize your learning experience
                </p>

                <div className="space-y-4">
                  {contentOptions.map((option, index) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className={`w-full h-auto bg-white/60 hover:bg-white/80 border border-slate-200/50 text-left justify-start p-6 luxury-transition group relative overflow-hidden ${
                          selectedOption === option.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 border-blue-500' : ''
                        }`}
                        onClick={() => handleNext(option.id)}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className="relative z-10 flex items-start gap-4 w-full">
                          <span className="text-4xl">{option.icon}</span>
                          <div className="flex-1">
                            <div className={`text-xl font-medium mb-2 ${
                              selectedOption === option.id ? 'text-white' : 'text-slate-900'
                            }`}>
                              {option.title}
                            </div>
                            <div className={`text-sm ${
                              selectedOption === option.id ? 'text-white/90' : 'text-slate-600'
                            }`}>
                              {option.description}
                            </div>
                          </div>
                          {selectedOption === option.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-blue-600" />
                            </motion.div>
                          )}
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Interaction Mode */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10"
              >
                <h2 className="text-4xl font-light mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  How would you like to interact?
                </h2>
                <p className="text-slate-600 text-lg mb-10">
                  Choose your preferred communication style
                </p>

                <div className="space-y-4">
                  {interactionOptions.map((option, index) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className={`w-full h-auto bg-white/60 hover:bg-white/80 border border-slate-200/50 text-left justify-start p-6 luxury-transition group relative overflow-hidden ${
                          selectedOption === option.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 border-blue-500' : ''
                        }`}
                        onClick={() => handleNext(option.id)}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className="relative z-10 flex items-start gap-4 w-full">
                          <span className="text-4xl">{option.icon}</span>
                          <div className="flex-1">
                            <div className={`text-xl font-medium mb-2 ${
                              selectedOption === option.id ? 'text-white' : 'text-slate-900'
                            }`}>
                              {option.title}
                            </div>
                            <div className={`text-sm ${
                              selectedOption === option.id ? 'text-white/90' : 'text-slate-600'
                            }`}>
                              {option.description}
                            </div>
                          </div>
                          {selectedOption === option.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-blue-600" />
                            </motion.div>
                          )}
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Voice Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10"
              >
                <h2 className="text-4xl font-light mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Choose Professor Carl's voice
                </h2>
                <p className="text-slate-600 text-lg mb-10">
                  Preview each voice and select your favorite
                </p>

                <div className="space-y-4">
                  {VOICES.map((voice, index) => (
                    <motion.div
                      key={voice.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex gap-3"
                    >
                      <Button
                        variant="outline"
                        className="flex-1 h-auto bg-white/60 hover:bg-white/80 border border-slate-200/50 text-left justify-start p-6 luxury-transition group"
                        onClick={() => handleComplete(voice.id)}
                      >
                        <div className="flex items-start gap-4 w-full">
                          <div className="w-12 h-12 rounded-full bg-white/80 border border-slate-200/50 flex items-center justify-center text-xl group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow duration-500">
                            🎙️
                          </div>
                          <div className="flex-1">
                            <div className="text-xl font-medium text-slate-900 mb-1">
                              {voice.name}
                            </div>
                            <div className="text-sm text-slate-600">
                              {voice.description}
                            </div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className={`h-auto px-6 bg-white/60 hover:bg-white/80 border border-slate-200/50 luxury-transition ${
                          playingVoice === voice.id ? 'shadow-lg shadow-blue-500/30 border-blue-500' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          previewVoice(voice.voiceName, voice.id)
                        }}
                        disabled={playingVoice === voice.id}
                      >
                        <Play className={`w-5 h-5 ${
                          playingVoice === voice.id ? 'text-blue-600' : 'text-slate-600'
                        }`} />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Elegant Progress Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 flex justify-center gap-3 mt-12"
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 * i }}
                className="relative"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === step
                      ? 'w-16 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30'
                      : i < step
                      ? 'w-16 bg-blue-400'
                      : 'w-12 bg-slate-200'
                  }`}
                />
              </motion.div>
            ))}
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
