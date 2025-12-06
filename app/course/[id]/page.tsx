'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  Lock
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface Material {
  id: string
  type: 'video' | 'document' | 'pdf' | 'link'
  title: string
  status: 'not_started' | 'in_progress' | 'completed'
}

interface Lesson {
  id: string
  title: string
  description: string
  objectives: string[]
  materials: Material[]
  completion_percentage: number
}

interface CourseData {
  id: string
  title: string
  description: string
  teacher_name: string
  lessons: Lesson[]
  overall_completion: number
}

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (!response.ok) {
        throw new Error('Failed to load course')
      }
      const data = await response.json()
      setCourse(data)
    } catch (err) {
      console.error('Error loading course:', err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const getMaterialIcon = (status: Material['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'in_progress':
        return <Play className="w-5 h-5 text-[#D4AF37]" />
      default:
        return <Circle className="w-5 h-5 text-white/30" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading course...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center p-6">
        <Card className="glass-panel p-8 max-w-md text-center">
          <p className="text-red-400 mb-4">Failed to load course</p>
          <Button onClick={() => router.back()} variant="outline" className="glass-panel hover:glass-hover">
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen aurora-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/catalog')}
            className="glass-panel hover:glass-hover mt-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </div>

        {/* Course Info */}
        <Card className="glass-panel p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-light text-gradient-gold mb-3">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-white/60 text-lg mb-4">
                  {course.description}
                </p>
              )}
              <p className="text-white/50">
                Taught by {course.teacher_name}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Overall Progress</span>
              <span className="text-sm text-[#D4AF37]">{course.overall_completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.overall_completion}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F7E7CE]"
              />
            </div>
          </div>
        </Card>

        {/* Lessons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-light text-white mb-4">
            Course Lessons
          </h2>

          {course.lessons.map((lesson, lessonIndex) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: lessonIndex * 0.1 }}
            >
              <Card className="glass-panel p-6 group">
                <div className="flex items-start gap-4">
                  {/* Lesson Number */}
                  <div className="w-10 h-10 rounded-full glass-panel-light flex items-center justify-center flex-shrink-0 text-[#D4AF37] font-medium">
                    {lessonIndex + 1}
                  </div>

                  <div className="flex-1">
                    {/* Lesson Title */}
                    <h3 className="text-xl font-light text-white mb-2">
                      {lesson.title}
                    </h3>

                    {/* Learning Objectives */}
                    {lesson.objectives.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-white/50 mb-2">Learning Objectives:</p>
                        <ul className="space-y-1">
                          {lesson.objectives.map((obj, i) => (
                            <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                              <span className="text-[#D4AF37] mt-1">•</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Materials */}
                    <div className="space-y-2">
                      {lesson.materials.map((material) => (
                        <Button
                          key={material.id}
                          onClick={() => router.push(`/lesson/${lesson.id}/material/${material.id}`)}
                          variant="ghost"
                          className="w-full justify-start glass-panel-light hover:glass-hover p-4 h-auto luxury-transition group/material"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getMaterialIcon(material.status)}
                            <div className="flex-1 text-left">
                              <p className="text-white group-hover/material:text-[#D4AF37] transition-colors">
                                {material.title}
                              </p>
                              <p className="text-sm text-white/40 capitalize">
                                {material.type}
                              </p>
                            </div>
                            {material.status === 'completed' ? (
                              <span className="text-xs text-green-400 px-2 py-1 rounded bg-green-400/10">
                                Completed
                              </span>
                            ) : material.status === 'in_progress' ? (
                              <span className="text-xs text-[#D4AF37] px-2 py-1 rounded bg-[#D4AF37]/10">
                                In Progress
                              </span>
                            ) : null}
                          </div>
                        </Button>
                      ))}
                      {lesson.materials.length === 0 && (
                        <p className="text-white/40 text-sm py-2">
                          No materials for this lesson yet
                        </p>
                      )}
                    </div>

                    {/* Lesson Progress */}
                    {lesson.materials.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/50">Lesson Progress</span>
                          <span className="text-xs text-[#D4AF37]">{lesson.completion_percentage}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-[#D4AF37] transition-all duration-500"
                            style={{ width: `${lesson.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
