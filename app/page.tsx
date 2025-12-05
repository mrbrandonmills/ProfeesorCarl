'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, Brain, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen aurora-bg-hero overflow-hidden">
      {/* Cinematic Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-6">
        {/* Floating particles background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                opacity: 0,
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 glass-panel-light px-6 py-3 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-white/90">
              Premium AI Education
            </span>
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-display font-light mb-6"
          >
            <span className="text-gradient-gold">Learn Through</span>
            <br />
            <span className="text-white">Discovery</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-luxury-body text-white/70 max-w-2xl mx-auto mb-12"
          >
            Professor Carl uses the Socratic method to guide you toward insights,
            not answers. Experience a revolutionary approach to learning that
            builds critical thinking and lasting understanding.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => router.push('/login')}
              size="lg"
              className="group relative glass-panel-heavy hover:glass-hover border-white/20 text-white text-lg px-8 py-6 h-auto shadow-glow-gold luxury-transition"
            >
              <span className="relative z-10 flex items-center gap-3">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>

            <Button
              onClick={() => router.push('/login')}
              size="lg"
              variant="outline"
              className="glass-panel hover:glass-hover border-white/20 text-white text-lg px-8 py-6 h-auto luxury-transition"
            >
              Student Portal
            </Button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-16"
          >
            {[
              { icon: Brain, text: 'Socratic Method' },
              { icon: MessageSquare, text: 'Voice Interaction' },
              { icon: Sparkles, text: 'Personalized Learning' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                className="flex items-center gap-2 glass-panel-light px-4 py-2 rounded-full"
              >
                <feature.icon className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-white/80">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1 h-3 bg-white/40 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Feature Showcase Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="relative py-32 px-6"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-hero font-light mb-6">
              <span className="text-gradient-luxury">Why Professor Carl?</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Traditional learning gives you answers. We help you discover them.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Socratic Dialogue',
                description: 'Guided questions that lead to profound understanding, not memorization.',
                icon: '🎓',
              },
              {
                title: 'Voice Interaction',
                description: 'Natural conversations that feel like learning from a real professor.',
                icon: '🎤',
              },
              {
                title: 'Adaptive Learning',
                description: 'Personalized paths that match your learning style and pace.',
                icon: '🧠',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="glass-panel p-8 luxury-transition"
              >
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-light mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Final CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative py-32 px-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-panel-heavy p-12 rounded-3xl"
          >
            <h2 className="text-hero font-light mb-6 text-gradient-gold">
              Ready to Think Differently?
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who've discovered the power of
              question-driven education.
            </p>
            <Button
              onClick={() => router.push('/login')}
              size="lg"
              className="group glass-panel-heavy hover:glass-hover border-white/20 text-white text-lg px-10 py-6 h-auto shadow-glow-gold luxury-transition"
            >
              <span className="flex items-center gap-3">
                Begin Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
