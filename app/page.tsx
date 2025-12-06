'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Sparkles,
  Brain,
  MessageSquare,
  BookOpen,
  Target,
  GraduationCap,
  Zap
} from 'lucide-react'
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
            className="text-luxury-body text-white/70 max-w-2xl mx-auto mb-16 leading-[1.7]"
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
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Button
              onClick={() => router.push('/catalog')}
              size="lg"
              className="group relative glass-panel-heavy hover:glass-hover border-white/20 text-white text-lg px-10 py-7 h-auto shadow-glow-gold luxury-transition w-full sm:w-auto min-w-[220px]"
            >
              <span className="relative z-10 flex items-center gap-3">
                Browse Courses
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>

            <Button
              onClick={() => router.push('/auth/signin')}
              size="lg"
              variant="outline"
              className="glass-panel hover:glass-hover border-white/30 text-white text-lg px-10 py-7 h-auto luxury-transition w-full sm:w-auto min-w-[220px] hover:border-[#D4AF37]/50"
            >
              Sign In
            </Button>

            <Button
              onClick={() => router.push('/professor/upload')}
              size="lg"
              variant="outline"
              className="glass-panel hover:glass-hover border-white/20 text-white/80 text-base px-8 py-6 h-auto luxury-transition w-full sm:w-auto"
            >
              Upload Course
            </Button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-20"
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

      {/* Feature Showcase Section - Museum Quality */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="relative py-24 sm:py-32 lg:py-40 px-6"
      >
        {/* Ambient gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20 sm:mb-24 lg:mb-28"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 glass-panel-light px-5 py-2.5 rounded-full mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-medium text-white/80">
                The Professor Carl Difference
              </span>
            </motion.div>

            <h2 className="text-hero font-light mb-8 leading-[1.1]">
              <span className="text-gradient-luxury">Why Professor Carl?</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-[1.7]">
              Traditional learning gives you answers. We help you discover them
              through guided exploration and critical thinking.
            </p>
          </motion.div>

          {/* Luxury Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {[
              {
                title: 'Structured Lessons',
                description:
                  'Explore meticulously crafted courses with video materials, comprehensive documents, and crystal-clear learning objectives.',
                icon: BookOpen,
                gradient: 'from-[#D4AF37]/20 to-transparent',
                iconColor: 'text-[#D4AF37]',
                shadowGlow: 'shadow-glow-gold',
              },
              {
                title: 'Progress Tracking',
                description:
                  'Monitor your intellectual journey with precision. Track completion across materials, lessons, and entire learning paths.',
                icon: Target,
                gradient: 'from-purple-500/20 to-transparent',
                iconColor: 'text-purple-400',
                shadowGlow: 'shadow-glow-purple',
              },
              {
                title: 'Socratic Chat',
                description:
                  'Engage with Professor Carl in transformative dialogue. Receive Socratic guidance that cultivates deep understanding.',
                icon: GraduationCap,
                gradient: 'from-blue-500/20 to-transparent',
                iconColor: 'text-blue-400',
                shadowGlow: 'shadow-glow-blue',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative"
              >
                {/* Card container with luxury glass */}
                <motion.div
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-full glass-panel-heavy p-8 sm:p-10 lg:p-12 rounded-3xl luxury-transition border-white/10 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon container with luxury treatment */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-panel-light mb-8 ${feature.shadowGlow} group-hover:${feature.shadowGlow}`}
                    >
                      <feature.icon
                        className={`w-8 h-8 ${feature.iconColor}`}
                        strokeWidth={1.5}
                      />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-2xl md:text-3xl font-light mb-5 text-white tracking-tight leading-[1.2]">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/60 leading-[1.65] text-base">
                      {feature.description}
                    </p>

                    {/* Decorative corner accent */}
                    <div className="absolute bottom-6 right-6 w-20 h-20 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-full blur-2xl`}
                      />
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </motion.div>

                {/* Outer glow effect on hover */}
                <div
                  className={`absolute inset-0 rounded-3xl ${feature.shadowGlow} opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10`}
                />
              </motion.div>
            ))}
          </div>

          {/* Supporting feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 mt-16 sm:mt-20 lg:mt-24"
          >
            {[
              { icon: Brain, text: 'AI-Powered Insights' },
              { icon: Zap, text: 'Instant Feedback' },
              { icon: MessageSquare, text: 'Voice Enabled' },
            ].map((pill, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="glass-panel-light px-6 py-3 rounded-full border border-white/10 hover:border-[#D4AF37]/30 luxury-transition cursor-default"
              >
                <div className="flex items-center gap-3">
                  <pill.icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={2} />
                  <span className="text-sm font-medium text-white/80">
                    {pill.text}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Final CTA Section - Cinematic Closing */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative py-24 sm:py-32 lg:py-40 px-6 overflow-hidden"
      >
        {/* Dramatic background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/5 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative group"
          >
            {/* Main CTA Panel with luxury treatment */}
            <div className="glass-panel-heavy p-10 sm:p-12 md:p-16 lg:p-20 rounded-[2rem] border border-white/20 relative overflow-hidden">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-purple-500/20 to-blue-500/20 blur-xl" />
              </div>

              {/* Top accent */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

              {/* Content */}
              <div className="relative z-10">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center gap-2 glass-panel-light px-5 py-2.5 rounded-full mb-8 border border-[#D4AF37]/20"
                >
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-sm font-medium text-white/90">
                    Begin Your Journey
                  </span>
                </motion.div>

                {/* Headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-hero font-light mb-8 leading-[1.1]"
                >
                  <span className="text-gradient-gold">Ready to Think</span>
                  <br />
                  <span className="text-white">Differently?</span>
                </motion.h2>

                {/* Subheadline */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-[1.7]"
                >
                  Join thousands of learners who've discovered the transformative
                  power of question-driven education. Your intellectual adventure
                  begins here.
                </motion.p>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <Button
                    onClick={() => router.push('/catalog')}
                    size="lg"
                    className="group relative glass-panel-heavy hover:glass-hover border-white/30 text-white text-lg px-12 py-7 h-auto shadow-glow-gold hover:shadow-glow-gold luxury-transition hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-3 font-medium">
                      Explore Courses
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-400" />
                    </span>
                    {/* Button glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  </Button>
                </motion.div>

                {/* Social proof pills */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mt-14 pt-10 border-t border-white/10"
                >
                  {[
                    { label: 'Premium Content', value: '500+' },
                    { label: 'Active Learners', value: '10K+' },
                    { label: 'Success Rate', value: '95%' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                      className="text-center"
                    >
                      <div className="text-2xl font-light text-[#D4AF37] mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-white/50">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
            </div>

            {/* Outer luxury glow */}
            <div className="absolute inset-0 rounded-[2rem] shadow-glow-gold opacity-30 group-hover:opacity-60 transition-opacity duration-700 -z-10" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
