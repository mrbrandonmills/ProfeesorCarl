'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Warm and friendly' },
  { id: 'echo', name: 'Echo', description: 'Clear and professional' },
  { id: 'nova', name: 'Nova', description: 'Energetic and engaging' },
]

export function PreferenceQuiz() {
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState({
    content_preference: '',
    interaction_mode: '',
    selected_voice: '',
  })

  const handleComplete = (voiceId: string) => {
    // Save to localStorage with the selected voice
    const finalPreferences = { ...preferences, selected_voice: voiceId }
    localStorage.setItem('preferences', JSON.stringify(finalPreferences))
    window.location.href = '/chat'
  }

  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gradient-blue-purple">
                How do you learn best?
              </h2>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full h-20 glass-hover text-left justify-start text-lg"
                  onClick={() => {
                    setPreferences({ ...preferences, content_preference: 'video-heavy' })
                    setStep(2)
                  }}
                >
                  <span className="text-2xl mr-4">🎥</span>
                  <span>Mostly videos</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-20 glass-hover text-left justify-start text-lg"
                  onClick={() => {
                    setPreferences({ ...preferences, content_preference: 'balanced' })
                    setStep(2)
                  }}
                >
                  <span className="text-2xl mr-4">📚</span>
                  <span>Balanced mix</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-20 glass-hover text-left justify-start text-lg"
                  onClick={() => {
                    setPreferences({ ...preferences, content_preference: 'text-heavy' })
                    setStep(2)
                  }}
                >
                  <span className="text-2xl mr-4">✍️</span>
                  <span>Mostly text</span>
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gradient-blue-purple">
                How do you prefer to interact?
              </h2>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full h-20 glass-hover text-left justify-start text-lg"
                  onClick={() => {
                    setPreferences({ ...preferences, interaction_mode: 'text' })
                    setStep(3)
                  }}
                >
                  <span className="text-2xl mr-4">💬</span>
                  <span>Type messages</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-20 glass-hover text-left justify-start text-lg"
                  onClick={() => {
                    setPreferences({ ...preferences, interaction_mode: 'dictate' })
                    setStep(3)
                  }}
                >
                  <span className="text-2xl mr-4">🎤</span>
                  <span>Dictate (voice input)</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-20 glass-hover text-left justify-start text-lg"
                  onClick={() => {
                    setPreferences({ ...preferences, interaction_mode: 'mixed' })
                    setStep(3)
                  }}
                >
                  <span className="text-2xl mr-4">🔄</span>
                  <span>Mix it up</span>
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gradient-blue-purple">
                Pick Carl's voice
              </h2>
              <div className="space-y-4">
                {VOICES.map((voice) => (
                  <Button
                    key={voice.id}
                    variant="outline"
                    className="w-full h-20 glass-hover text-left justify-start text-lg"
                    onClick={() => handleComplete(voice.id)}
                  >
                    <div>
                      <div className="font-semibold">{voice.name}</div>
                      <div className="text-sm text-muted-foreground">{voice.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                    : i < step
                    ? 'bg-blue-500/50'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
