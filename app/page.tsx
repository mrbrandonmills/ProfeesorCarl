'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { BookOpen, Brain, Target, ArrowRight, Play, Star, Sparkles, Zap, MessageSquare } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">PC</span>
            </div>
            <span className="text-slate-900 font-bold text-xl">Professor Carl</span>
          </div>
          <div className="flex items-center gap-8">
            <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Features
            </button>
            <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Pricing
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-8">
                <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span className="text-sm font-semibold text-blue-900">AI-Powered Learning</span>
              </div>

              {/* Title */}
              <h1 className="text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-tight">
                Learn
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Smarter
                </span>
                <br />
                Not Harder
              </h1>

              {/* Description */}
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                Master any subject through AI-powered Socratic dialogue that adapts to your unique learning style
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/catalog')}
                  className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => router.push('/catalog')}
                  className="px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 font-bold text-lg hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-12 mt-12">
                <div>
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    500+
                  </div>
                  <div className="text-sm text-slate-500 font-medium">Courses</div>
                </div>
                <div>
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    10K+
                  </div>
                  <div className="text-sm text-slate-500 font-medium">Students</div>
                </div>
                <div>
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    95%
                  </div>
                  <div className="text-sm text-slate-500 font-medium">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Right Content - Feature Cards */}
            <div className="relative h-[600px] hidden lg:block">
              {/* Card 1 */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-80 p-8 rounded-3xl bg-white shadow-2xl border border-slate-100"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-6">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Tutor</h3>
                <p className="text-slate-600 leading-relaxed">
                  Personalized learning paths adapted to your pace and style
                </p>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-32 left-0 w-80 p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 shadow-2xl border border-purple-100"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Socratic Method</h3>
                <p className="text-slate-600 leading-relaxed">
                  Learn through guided questions, not passive lectures
                </p>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 right-20 w-80 p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-2xl border border-orange-100"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Track Progress</h3>
                <p className="text-slate-600 leading-relaxed">
                  Real-time insights into your learning journey
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Excel
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              A complete platform designed for deep, meaningful learning
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: 'Structured Courses', desc: 'Organized lessons with clear objectives', gradient: 'from-blue-500 to-indigo-500', bg: 'from-blue-50 to-indigo-50' },
              { icon: MessageSquare, title: 'AI Chat', desc: 'Ask questions and get guided responses', gradient: 'from-purple-500 to-pink-500', bg: 'from-purple-50 to-pink-50' },
              { icon: Target, title: 'Progress Tracking', desc: 'Monitor your learning in real-time', gradient: 'from-amber-500 to-orange-500', bg: 'from-amber-50 to-orange-50' },
              { icon: Sparkles, title: 'Smart Insights', desc: 'AI-powered learning recommendations', gradient: 'from-emerald-500 to-teal-500', bg: 'from-emerald-50 to-teal-50' },
              { icon: Zap, title: 'Instant Feedback', desc: 'Get immediate responses to your work', gradient: 'from-rose-500 to-pink-500', bg: 'from-rose-50 to-pink-50' },
              { icon: Brain, title: 'Adaptive Learning', desc: 'Content that adjusts to your level', gradient: 'from-violet-500 to-purple-500', bg: 'from-violet-50 to-purple-50' },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group p-8 rounded-3xl bg-gradient-to-br ${feature.bg} border border-slate-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        {/* Decorative Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-8 leading-tight">
            Ready to Transform
            <br />
            Your Learning?
          </h2>
          <p className="text-2xl text-white/90 mb-12 font-medium">
            Join thousands of students already learning smarter
          </p>

          <button
            onClick={() => router.push('/catalog')}
            className="px-12 py-5 rounded-2xl bg-white text-slate-900 font-black text-xl shadow-2xl hover:shadow-white/40 transition-all hover:scale-105 inline-flex items-center gap-3"
          >
            Get Started for Free
            <ArrowRight className="w-6 h-6" />
          </button>

          <p className="text-white/80 mt-8 text-lg">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-900 font-bold text-lg">Professor Carl</p>
          <p className="text-slate-500 text-sm mt-2">© 2025 • Powered by Claude AI</p>
        </div>
      </footer>
    </div>
  )
}
