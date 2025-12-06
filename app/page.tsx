'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookOpen, MessageSquare, BarChart3, Video, FileText, Users, Sparkles, Brain, Zap, Target, ArrowRight, Play, Star } from 'lucide-react'
import { useRef } from 'react'

export default function Home() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Floating Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-6 px-8 py-4 rounded-full bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PC</span>
            </div>
            <span className="text-gray-900 font-semibold">Professor Carl</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Features</button>
            <button className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Pricing</button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/login')}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
            >
              Sign In
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Completely New Layout */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-32 pb-20 relative">
        {/* Organic Background Shapes */}
        <motion.div
          style={{ y: y1 }}
          className="absolute top-20 -right-40 w-[600px] h-[600px] rounded-[40%_60%_70%_30%/60%_30%_70%_40%] bg-gradient-to-br from-emerald-100 to-cyan-100 opacity-60 blur-3xl"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute -bottom-20 -left-40 w-[500px] h-[500px] rounded-[60%_40%_30%_70%/40%_60%_30%_70%] bg-gradient-to-br from-pink-100 to-purple-100 opacity-50 blur-3xl"
        />

        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left Side - Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200/50 mb-8">
              <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span className="text-sm font-semibold text-emerald-900">AI-Powered Socratic Learning</span>
            </div>

            {/* Massive Title */}
            <h1 className="text-7xl lg:text-8xl font-black text-gray-900 mb-6 leading-[0.9] tracking-tight">
              Learn
              <br />
              <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Smarter
              </span>
              <br />
              Not Harder
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
              Master any subject through AI-powered Socratic dialogue that adapts to your learning style
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/catalog')}
                className="group px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-2">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/catalog')}
                className="px-8 py-5 rounded-2xl bg-white border-2 border-gray-200 text-gray-900 font-bold text-lg hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-2 justify-center"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </motion.button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-12 mt-12">
              {[
                { value: '500+', label: 'Courses' },
                { value: '10K+', label: 'Students' },
                { value: '95%', label: 'Success Rate' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - 3D Card Stack */}
          <div className="relative h-[600px] hidden lg:block">
            {/* Floating Cards */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [-2, 2, -2],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 right-0 w-80 p-8 rounded-3xl bg-white shadow-2xl border border-gray-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Tutor</h3>
              <p className="text-gray-600">Personalized learning paths adapted to your pace</p>
            </motion.div>

            <motion.div
              animate={{
                y: [0, 20, 0],
                rotate: [2, -2, 2],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-32 left-0 w-80 p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 shadow-2xl border border-purple-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Socratic Method</h3>
              <p className="text-gray-600">Learn through guided questions, not lectures</p>
            </motion.div>

            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [-1, 1, -1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-0 right-20 w-80 p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-2xl border border-orange-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600">Real-time insights into your learning journey</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl font-black text-gray-900 mb-6">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Excel
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A complete platform designed for deep, meaningful learning
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Structured Courses', desc: 'Organized lessons with clear learning objectives', color: 'from-emerald-400 to-cyan-500', bg: 'from-emerald-50 to-cyan-50' },
              { icon: MessageSquare, title: 'AI Chat', desc: 'Ask questions and get guided responses', color: 'from-pink-400 to-purple-500', bg: 'from-pink-50 to-purple-50' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track your progress in real-time', color: 'from-amber-400 to-orange-500', bg: 'from-amber-50 to-orange-50' },
              { icon: Video, title: 'Video Lessons', desc: 'Watch and learn at your own pace', color: 'from-blue-400 to-indigo-500', bg: 'from-blue-50 to-indigo-50' },
              { icon: FileText, title: 'Study Materials', desc: 'PDFs, docs, and resources', color: 'from-green-400 to-teal-500', bg: 'from-green-50 to-teal-50' },
              { icon: Users, title: 'Community', desc: 'Learn with peers and teachers', color: 'from-rose-400 to-pink-500', bg: 'from-rose-50 to-pink-50' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`p-8 rounded-3xl bg-gradient-to-br ${feature.bg} border border-gray-100 shadow-lg hover:shadow-2xl transition-all cursor-pointer group`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Bold & Vibrant */}
      <section className="py-32 px-6 bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 relative overflow-hidden">
        {/* Animated Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" style={{ animationDelay: '3s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl md:text-7xl font-black text-white mb-8 leading-tight">
              Ready to Transform
              <br />
              Your Learning?
            </h2>
            <p className="text-2xl text-white/90 mb-12 font-medium">
              Join thousands of students already learning smarter
            </p>

            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/catalog')}
              className="px-12 py-6 rounded-2xl bg-white text-gray-900 font-black text-xl shadow-2xl hover:shadow-white/40 transition-all"
            >
              Get Started for Free →
            </motion.button>

            <p className="text-white/80 mt-6">No credit card required • 14-day free trial</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 font-medium">Professor Carl</p>
          <p className="text-gray-400 text-sm mt-2">© 2025 • Powered by Claude AI</p>
        </div>
      </footer>
    </div>
  )
}
