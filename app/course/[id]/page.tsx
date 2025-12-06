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
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-600" />
      default:
        return <Circle className="w-5 h-5 text-slate-300" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading course...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">Failed to load course</p>
          <Button onClick={() => router.back()} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
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
            className="bg-white/60 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:bg-white/80 hover:border-blue-300 transition-all duration-300 mt-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </div>

        {/* Course Info */}
        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-light bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-3">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-slate-600 text-lg mb-4">
                  {course.description}
                </p>
              )}
              <p className="text-slate-500">
                Taught by {course.teacher_name}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Overall Progress</span>
              <span className="text-sm text-blue-600 font-medium">{course.overall_completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.overall_completion}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"
              />
            </div>
          </div>
        </Card>

        {/* Lessons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-light text-slate-800 mb-4">
            Course Lessons
          </h2>

          {course.lessons.map((lesson, lessonIndex) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: lessonIndex * 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-6 group hover:shadow-xl hover:border-blue-300/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  {/* Lesson Number */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 flex items-center justify-center flex-shrink-0 text-blue-600 font-medium">
                    {lessonIndex + 1}
                  </div>

                  <div className="flex-1">
                    {/* Lesson Title */}
                    <h3 className="text-xl font-light text-slate-800 mb-2">
                      {lesson.title}
                    </h3>

                    {/* Learning Objectives */}
                    {lesson.objectives.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-500 mb-2">Learning Objectives:</p>
                        <ul className="space-y-1">
                          {lesson.objectives.map((obj, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
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
                          className="w-full justify-start bg-slate-50/50 hover:bg-blue-50 border border-slate-200/50 hover:border-blue-300 p-4 h-auto transition-all duration-300 group/material"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getMaterialIcon(material.status)}
                            <div className="flex-1 text-left">
                              <p className="text-slate-800 group-hover/material:text-blue-600 transition-colors">
                                {material.title}
                              </p>
                              <p className="text-sm text-slate-500 capitalize">
                                {material.type}
                              </p>
                            </div>
                            {material.status === 'completed' ? (
                              <span className="text-xs text-green-600 px-2 py-1 rounded bg-green-50 border border-green-200">
                                Completed
                              </span>
                            ) : material.status === 'in_progress' ? (
                              <span className="text-xs text-blue-600 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                                In Progress
                              </span>
                            ) : null}
                          </div>
                        </Button>
                      ))}
                      {lesson.materials.length === 0 && (
                        <p className="text-slate-500 text-sm py-2">
                          No materials for this lesson yet
                        </p>
                      )}
                    </div>

                    {/* Lesson Progress */}
                    {lesson.materials.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">Lesson Progress</span>
                          <span className="text-xs text-blue-600 font-medium">{lesson.completion_percentage}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-slate-200/50 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
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
