'use client'

// ===========================================
// VOICE CONVERSATION PAGE
// ===========================================
// Real-time voice dialogue with Professor Carl

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import VoiceConversationUI from '@/components/voice/VoiceConversationUI'
import { ArrowLeft } from 'lucide-react'

function VoicePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for demo mode
  const isDemo = searchParams.get('demo') === 'true'
  const presentationMode = searchParams.get('presentation') === 'true'

  useEffect(() => {
    // Check for authenticated user or demo mode
    const checkAuth = async () => {
      try {
        // Try to get user from session storage (demo mode)
        const demoContext = sessionStorage.getItem('demoContext')
        if (demoContext) {
          const parsed = JSON.parse(demoContext)
          setUserId(parsed.userName || 'demo-user')
          setIsLoading(false)
          return
        }

        // Try to get user from preferences (regular user)
        const prefs = sessionStorage.getItem('userPreferences')
        if (prefs) {
          const parsed = JSON.parse(prefs)
          setUserId(parsed.userId || 'authenticated-user')
          setIsLoading(false)
          return
        }

        // Default for demo access
        if (isDemo || presentationMode) {
          setUserId('brandon-mills-demo')
          setIsLoading(false)
          return
        }

        // No auth, redirect to login
        router.push('/login')
      } catch (error) {
        console.error('Auth check error:', error)
        if (isDemo) {
          setUserId('demo-user')
        } else {
          router.push('/login')
        }
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, isDemo, presentationMode])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Preparing voice session...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #1e3a5f 50%, #1e1b4b 75%, #0f172a 100%)',
      }}
    >
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent 70%)',
            top: '-10%',
            left: '-10%',
            animation: 'subtleFloat 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4), transparent 70%)',
            bottom: '-5%',
            right: '-5%',
            animation: 'subtleFloat 12s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4), transparent 70%)',
            top: '40%',
            left: '60%',
            animation: 'subtleFloat 18s ease-in-out infinite',
          }}
        />
      </div>

      {/* Global animation keyframes */}
      <style jsx global>{`
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(15px); }
        }
      `}</style>

      {/* Navigation - Glass Effect */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push(isDemo ? '/demo' : '/')}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {isDemo ? 'Back to Demo' : 'Exit'}
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 25px -5px rgba(99, 102, 241, 0.5)',
              }}
            >
              <span className="text-white font-bold text-lg">PC</span>
            </div>
            <span className="text-white font-bold text-xl">
              Professor Carl
              {isDemo && (
                <span
                  className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full"
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                  }}
                >
                  DEMO
                </span>
              )}
            </span>
          </div>

          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 relative z-10">
        {userId && (
          <VoiceConversationUI
            userId={userId}
            isDemo={isDemo}
            presentationMode={presentationMode}
            onSessionEnd={async (report) => {
              console.log('Session ended with report:', report)
              // Save session to database
              try {
                await fetch('/api/session/end', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: `session_${Date.now()}`,
                    userId,
                    report,
                    isDemo,
                    timestamp: new Date().toISOString()
                  })
                })
              } catch (err) {
                console.error('Failed to save session:', err)
              }
            }}
          />
        )}
      </main>

      {/* Demo Mode Footer - Glass Effect */}
      {isDemo && (
        <footer
          className="fixed bottom-0 left-0 right-0 py-3 px-6 text-center text-sm z-50"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 -10px 40px -10px rgba(99, 102, 241, 0.3)',
          }}
        >
          <span className="text-white font-semibold">UCSD Faculty Demo</span>
          <span className="mx-2 text-white/60">•</span>
          <span className="text-white/90">Real-time voice + emotional awareness powered by Hume EVI & Claude</span>
        </footer>
      )}
    </div>
  )
}

// Loading fallback for Suspense
function VoicePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Loading voice session...</p>
      </div>
    </div>
  )
}

// Main export with Suspense wrapper
export default function VoicePage() {
  return (
    <Suspense fallback={<VoicePageLoading />}>
      <VoicePageContent />
    </Suspense>
  )
}
