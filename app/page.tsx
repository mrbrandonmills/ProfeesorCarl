'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, MessageSquare, BarChart3, Video, FileText, Sparkles, Brain, Zap, Target } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Clean Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">PC</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">Professor Carl</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/catalog')}>
              Browse Courses
            </Button>
            <Button onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Socratic Learning
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Learn Through Discovery,
            <br />
            Not Memorization
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            Professor Carl uses the Socratic method powered by AI to guide students
            toward insights through critical thinking and personalized questioning.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => router.push('/catalog')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              Explore Courses
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/login')}
              className="px-8 py-6 text-lg border-2"
            >
              Sign In
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-12 mt-16 text-center"
          >
            <div>
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600 mt-1">Courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600 mt-1">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600 mt-1">Success Rate</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Teach and Learn
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A complete platform for professors to upload courses and students to
            engage in deep, Socratic learning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: BookOpen,
              title: 'Structured Courses',
              description:
                'Upload and organize lessons with videos, documents, PDFs, and learning objectives.',
              color: 'blue',
            },
            {
              icon: MessageSquare,
              title: 'Socratic Chat',
              description:
                'AI-powered dialogue that guides students to discover answers through questioning.',
              color: 'purple',
            },
            {
              icon: BarChart3,
              title: 'Progress Tracking',
              description:
                'Monitor student engagement and completion across all materials and courses.',
              color: 'green',
            },
            {
              icon: Video,
              title: 'Video Integration',
              description:
                'Seamlessly embed YouTube videos and other multimedia content into lessons.',
              color: 'red',
            },
            {
              icon: FileText,
              title: 'Document Upload',
              description:
                'Extract course structure from PDFs and DOCX files using AI-powered analysis.',
              color: 'orange',
            },
            {
              icon: Users,
              title: 'Role-Based Access',
              description:
                'Separate interfaces for professors and students with tailored experiences.',
              color: 'indigo',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div
                className={`w-14 h-14 bg-${feature.color}-100 rounded-lg flex items-center justify-center mb-6`}
              >
                <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Professor Carl Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your teaching and learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '1',
                title: 'Professors Upload',
                description:
                  'Create courses by topic or upload documents. Our AI extracts structure and learning objectives automatically.',
              },
              {
                step: '2',
                title: 'Students Engage',
                description:
                  'Browse courses, watch videos, read materials, and track progress through each lesson.',
              },
              {
                step: '3',
                title: 'Learn Through Chat',
                description:
                  'Ask questions to Professor Carl who guides you with Socratic dialogue tailored to your lesson.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              stat: '10x',
              label: 'Faster Learning',
              description: 'Students grasp concepts 10x faster with Socratic guidance',
            },
            {
              icon: Target,
              stat: '95%',
              label: 'Success Rate',
              description: 'Students successfully complete courses with AI assistance',
            },
            {
              icon: Zap,
              stat: '50K+',
              label: 'Questions Asked',
              description: 'Socratic questions answered by Professor Carl',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{item.stat}</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">{item.label}</div>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-12 md:p-16 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join educators and students who are discovering the power of Socratic
            learning powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push('/catalog')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/professor/upload')}
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
            >
              Upload Course
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p className="mb-2 text-lg font-medium text-gray-900">
            Professor Carl
          </p>
          <p className="mb-4">
            © 2025 Professor Carl. Built for the California Higher Education AI
            Conference.
          </p>
          <p className="text-sm">
            Powered by Claude AI • Next.js • Neon Postgres
          </p>
        </div>
      </footer>
    </div>
  )
}
