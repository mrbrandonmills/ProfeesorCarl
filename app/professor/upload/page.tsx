'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Youtube, BookOpen } from 'lucide-react'

type UploadMethod = 'topic-based' | 'document-video' | null

export default function ProfessorUploadPage() {
  const [selectedMethod, setSelectedMethod] = useState<UploadMethod>(null)

  const uploadMethods = [
    {
      id: 'topic-based' as const,
      icon: BookOpen,
      title: 'Topic-Based Upload',
      description: 'Manually enter course topics, lessons, and materials',
      features: [
        'Create course structure by topic',
        'Add learning objectives per lesson',
        'Link videos and documents manually',
        'Full control over organization'
      ],
      gradient: 'from-blue-500/10 to-indigo-500/10',
    },
    {
      id: 'document-video' as const,
      icon: FileText,
      title: 'Document + Video Upload',
      description: 'Upload curriculum documents and link YouTube videos',
      features: [
        'Upload PDF syllabi or lesson plans',
        'AI extracts course structure',
        'Add YouTube videos per lesson',
        'Automatic transcript extraction'
      ],
      gradient: 'from-indigo-500/10 to-blue-500/10',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-3">
            Upload Course Content
          </h1>
          <p className="text-slate-600 text-lg">
            Choose how you'd like to structure your course for Professor Carl
          </p>
        </div>

        {/* Upload Method Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {uploadMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`bg-white/80 backdrop-blur-xl border p-8 cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                  selectedMethod === method.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20'
                    : 'border-slate-200/50 hover:border-blue-300 hover:shadow-lg'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <method.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-light text-slate-900 mb-3">
                    {method.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 mb-6">
                    {method.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {method.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Selected Indicator */}
                  {selectedMethod === method.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                    >
                      <Upload className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedMethod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg px-10 py-6 h-auto shadow-lg shadow-blue-500/30 transition-all duration-300 group border-0"
              onClick={() => {
                window.location.href = `/professor/upload/${selectedMethod}`
              }}
            >
              <span className="flex items-center gap-3">
                Continue with {uploadMethods.find(m => m.id === selectedMethod)?.title}
                <Upload className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform duration-300" />
              </span>
            </Button>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-white/60 backdrop-blur-xl border border-slate-200/50 p-6">
            <h4 className="text-lg font-medium text-slate-900 mb-3">
              💡 About Course Upload
            </h4>
            <div className="text-slate-600 space-y-2 text-sm">
              <p>
                • <strong>Topic-Based:</strong> Best for structured courses where you want precise control over lesson organization
              </p>
              <p>
                • <strong>Document + Video:</strong> Ideal for existing curriculum - upload your syllabus and link relevant videos
              </p>
              <p>
                • All methods create the same lesson structure that students can explore with Professor Carl's Socratic guidance
              </p>
              <p>
                • You can edit and reorganize lessons after upload
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
