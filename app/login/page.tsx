'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, Users, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'professor' | 'student'>('professor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Try proper login first (for registered users with passwords)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Redirect based on role from response
        const userRole = data.user?.role
        router.push(userRole === 'teacher' ? '/professor/dashboard' : '/onboarding')
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAccess = async (role: 'professor' | 'student') => {
    try {
      const response = await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: role === 'professor' ? 'professor@university.edu' : 'student@university.edu',
          password: 'demo',
          role
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push(role === 'professor' ? '/dashboard' : '/onboarding')
      }
    } catch (error) {
      console.error('Quick access error:', error)
    }
  }

  // Demo persona quick login
  const handlePersonaLogin = async (persona: { name: string; email: string; role: 'professor' | 'student' }) => {
    try {
      const response = await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: persona.email,
          password: 'demo',
          role: persona.role,
          name: persona.name,
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push(persona.role === 'professor' ? '/dashboard' : '/onboarding')
      }
    } catch (error) {
      console.error('Persona login error:', error)
    }
  }

  const DEMO_PERSONAS = [
    { name: 'Jesse', email: 'jesse@demo.edu', role: 'student' as const },
    { name: 'Brandon', email: 'brandon@demo.edu', role: 'student' as const },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-2xl p-10 rounded-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl font-bold mb-3"
            >
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Welcome to</span>
              <br />
              <span className="text-slate-900">Professor Carl</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-slate-600"
            >
              {mode === 'professor' ? 'Professor Login' : 'Student Login'}
            </motion.p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </motion.div>
          )}

          {/* Role Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-2 p-1.5 bg-slate-100 rounded-xl mb-8"
          >
            <button
              onClick={() => setMode('professor')}
              className={`flex-1 px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'professor'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Professor</span>
            </button>
            <button
              onClick={() => setMode('student')}
              className={`flex-1 px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'student'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Student</span>
            </button>
          </motion.div>

          {/* Login Form */}
          <motion.form
            onSubmit={handleLogin}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="space-y-5"
          >
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder={mode === 'professor' ? 'professor@university.edu' : 'student@university.edu'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Mock Credentials Hint */}
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
              <p className="text-xs text-blue-600 text-center mb-1 font-medium">
                Mock credentials for testing:
              </p>
              <p className="text-xs font-mono text-blue-700 text-center">
                {mode === 'professor' ? 'professor@university.edu' : 'student@university.edu'} / any password
              </p>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all py-6 font-semibold text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </motion.form>

          {/* Switch Mode Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center text-sm text-slate-600 mt-6"
          >
            {mode === 'professor' ? 'Are you a student?' : 'Are you a professor?'}{' '}
            <button
              onClick={() => setMode(mode === 'professor' ? 'student' : 'professor')}
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium"
            >
              {mode === 'professor' ? 'Student Login' : 'Professor Login'}
            </button>
          </motion.p>

          {/* Register Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="text-center text-sm text-slate-600 mt-3"
          >
            Don&apos;t have an account?{' '}
            <button
              onClick={() => router.push('/register')}
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium"
            >
              Create Account
            </button>
          </motion.p>
        </div>

        {/* Quick Testing Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 bg-white/60 backdrop-blur-lg border border-slate-200/50 p-6 rounded-2xl shadow-lg"
        >
          <h3 className="text-center text-sm font-medium text-slate-700 mb-4">
            Quick Testing Access
          </h3>
          <div className="flex gap-3 mb-4">
            <Button
              onClick={() => handleQuickAccess('professor')}
              variant="outline"
              className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Login as Professor
            </Button>
            <Button
              onClick={() => handleQuickAccess('student')}
              variant="outline"
              className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Login as Student
            </Button>
          </div>

          {/* Demo Personas */}
          <div className="pt-4 border-t border-slate-200/50">
            <p className="text-xs text-slate-500 text-center mb-3">Demo Personas</p>
            <div className="flex gap-2 justify-center">
              {DEMO_PERSONAS.map((persona) => (
                <Button
                  key={persona.email}
                  onClick={() => handlePersonaLogin(persona)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {persona.name}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-6"
        >
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
