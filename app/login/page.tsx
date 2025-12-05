'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, Users } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'professor' | 'student'>('professor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: mode })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect based on role
        router.push(mode === 'professor' ? '/dashboard' : '/onboarding')
      }
    } catch (error) {
      console.error('Login error:', error)
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

  return (
    <div className="min-h-screen aurora-bg-hero flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Login Card */}
        <div className="glass-panel-heavy p-10 rounded-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl font-light mb-3"
            >
              <span className="text-gradient-gold">Welcome to</span>
              <br />
              <span className="text-white">Professor Carl</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-white/60"
            >
              {mode === 'professor' ? 'Professor Login' : 'Student Login'}
            </motion.p>
          </div>

          {/* Role Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-2 p-1.5 glass-panel-light rounded-xl mb-8"
          >
            <button
              onClick={() => setMode('professor')}
              className={`flex-1 px-4 py-3 rounded-lg luxury-transition flex items-center justify-center gap-2 ${
                mode === 'professor'
                  ? 'glass-panel-heavy shadow-glow-gold text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Professor</span>
            </button>
            <button
              onClick={() => setMode('student')}
              className={`flex-1 px-4 py-3 rounded-lg luxury-transition flex items-center justify-center gap-2 ${
                mode === 'student'
                  ? 'glass-panel-heavy shadow-glow-blue text-white'
                  : 'text-white/50 hover:text-white/80'
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
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder={mode === 'professor' ? 'professor@university.edu' : 'student@university.edu'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-panel border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-panel border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            {/* Mock Credentials Hint */}
            <div className="glass-panel-light p-3 rounded-lg">
              <p className="text-xs text-white/50 text-center mb-1">
                Mock credentials for testing:
              </p>
              <p className="text-xs font-mono text-white/70 text-center">
                {mode === 'professor' ? 'professor@university.edu' : 'student@university.edu'} / any password
              </p>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full glass-panel-heavy hover:glass-hover border-white/20 text-white shadow-glow-gold luxury-transition py-6"
            >
              Sign In
            </Button>
          </motion.form>

          {/* Switch Mode Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center text-sm text-white/60 mt-6"
          >
            {mode === 'professor' ? 'Are you a student?' : 'Are you a professor?'}{' '}
            <button
              onClick={() => setMode(mode === 'professor' ? 'student' : 'professor')}
              className="text-[#D4AF37] hover:underline luxury-transition"
            >
              {mode === 'professor' ? 'Student Login' : 'Professor Login'}
            </button>
          </motion.p>
        </div>

        {/* Quick Testing Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 glass-panel p-6 rounded-2xl"
        >
          <h3 className="text-center text-sm font-medium text-white/70 mb-4">
            Quick Testing Access
          </h3>
          <div className="flex gap-3">
            <Button
              onClick={() => handleQuickAccess('professor')}
              variant="outline"
              className="flex-1 glass-panel hover:glass-hover border-white/20 text-white luxury-transition"
            >
              Login as Professor
            </Button>
            <Button
              onClick={() => handleQuickAccess('student')}
              variant="outline"
              className="flex-1 glass-panel hover:glass-hover border-white/20 text-white luxury-transition"
            >
              Login as Student
            </Button>
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
            className="text-sm text-white/50 hover:text-white/80 luxury-transition"
          >
            ← Back to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
