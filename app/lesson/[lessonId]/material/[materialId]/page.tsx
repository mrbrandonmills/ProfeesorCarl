'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  BookOpen,
  Youtube,
  FileText,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface Material {
  id: string
  lesson_id: string
  type: 'video' | 'document' | 'pdf' | 'link'
  title: string
  content_url: string
  transcript: string | null
  duration_seconds: number | null
}

interface Lesson {
  id: string
  title: string
  objectives: string[]
  course_id: string
  course_title: string
}

interface MaterialData {
  material: Material
  lesson: Lesson
  progress: {
    status: 'not_started' | 'in_progress' | 'completed'
    time_spent_seconds: number
  }
}

export default function MaterialPlayerPage() {
  const router = useRouter()
  const params = useParams()
  const lessonId = params.lessonId as string
  const materialId = params.materialId as string

  const [data, setData] = useState<MaterialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    loadMaterial()
  }, [materialId])

  const loadMaterial = async () => {
    try {
      const response = await fetch(`/api/materials/${materialId}`)
      if (!response.ok) throw new Error('Failed to load material')

      const materialData = await response.json()
      setData(materialData)

      // Mark as started if not already
      if (materialData.progress.status === 'not_started') {
        await fetch('/api/progress/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId })
        })
      }
    } catch (error) {
      console.error('Error loading material:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!data) return

    setCompleting(true)
    try {
      const response = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId })
      })

      if (response.ok) {
        setData({
          ...data,
          progress: { ...data.progress, status: 'completed' }
        })
      }
    } catch (error) {
      console.error('Error completing material:', error)
    } finally {
      setCompleting(false)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  const startChatWithContext = () => {
    if (!data) return

    // Store lesson context in session storage
    sessionStorage.setItem('lessonContext', JSON.stringify({
      lessonId: data.lesson.id,
      lessonTitle: data.lesson.title,
      objectives: data.lesson.objectives,
      materialTitle: data.material.title,
      materialType: data.material.type
    }))

    router.push('/chat')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading material...</p>
        </motion.div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">Failed to load material</p>
          <Button onClick={() => router.back()} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  const { material, lesson, progress } = data
  const embedUrl = material.type === 'video' ? getYouTubeEmbedUrl(material.content_url) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/course/${lesson.course_id}`)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-slate-500 text-sm">{lesson.course_title}</p>
              <h2 className="text-slate-800 font-medium">{lesson.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {progress.status === 'completed' ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-600 text-sm font-medium">Completed</span>
              </div>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={completing}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group"
              >
                {completing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Marking Complete...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Mark as Complete
                  </span>
                )}
              </Button>
            )}
            <Button
              onClick={startChatWithContext}
              className="bg-white hover:bg-blue-50 border border-blue-300 text-blue-600 hover:text-blue-700 hover:border-blue-400 shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              Ask Professor Carl
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Material Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-light bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-2">
                {material.title}
              </h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                {material.type === 'video' && <Youtube className="w-4 h-4" />}
                {material.type === 'document' && <FileText className="w-4 h-4" />}
                {material.type === 'link' && <ExternalLink className="w-4 h-4" />}
                <span className="capitalize">{material.type}</span>
                {material.duration_seconds && (
                  <>
                    <span>•</span>
                    <span>{Math.round(material.duration_seconds / 60)} minutes</span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Content Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white backdrop-blur-xl border border-slate-200/50 shadow-lg p-0 overflow-hidden">
                {material.type === 'video' && embedUrl ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : material.type === 'pdf' || material.type === 'document' ? (
                  <div className="p-8 text-center">
                    <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-700 mb-4">Document Viewer</p>
                    <Button
                      onClick={() => window.open(material.content_url, '_blank')}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ExternalLink className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-700 mb-4">External Resource</p>
                    <Button
                      onClick={() => window.open(material.content_url, '_blank')}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Transcript (if available) */}
            {material.transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-6">
                  <h3 className="text-xl font-light text-slate-800 mb-4">Transcript</h3>
                  <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {material.transcript}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Learning Objectives */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-light text-slate-800">Learning Objectives</h3>
                </div>
                <ul className="space-y-3">
                  {lesson.objectives.map((objective, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 flex items-center justify-center flex-shrink-0 text-blue-600 text-sm font-medium">
                        {i + 1}
                      </div>
                      <p className="text-slate-600 text-sm">{objective}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Ask Professor Carl CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-lg p-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white border border-blue-200 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-light text-slate-800 mb-2">
                    Have Questions?
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Ask Professor Carl to guide you through this material using the Socratic method
                  </p>
                  <Button
                    onClick={startChatWithContext}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group"
                  >
                    <MessageSquare className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Start Discussion
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Progress Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 shadow-sm p-4">
                <p className="text-xs text-slate-500 mb-2">Your Progress</p>
                <div className="flex items-center gap-2">
                  {progress.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Completed</span>
                    </>
                  ) : progress.status === 'in_progress' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-blue-600 font-medium">In Progress</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      <span className="text-sm text-slate-500">Not Started</span>
                    </>
                  )}
                </div>
                {progress.time_spent_seconds > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    Time spent: {Math.round(progress.time_spent_seconds / 60)} minutes
                  </p>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
