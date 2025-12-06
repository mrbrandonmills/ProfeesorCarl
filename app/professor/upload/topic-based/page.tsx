'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Youtube,
  FileText,
  Link as LinkIcon,
  Save,
  Check
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Material {
  id: string
  type: 'video' | 'document' | 'link'
  title: string
  url: string
}

interface Lesson {
  id: string
  title: string
  objectives: string[]
  materials: Material[]
}

interface CourseData {
  title: string
  description: string
  lessons: Lesson[]
}

export default function TopicBasedUploadPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    lessons: []
  })

  const addLesson = () => {
    setCourseData({
      ...courseData,
      lessons: [
        ...courseData.lessons,
        {
          id: `lesson-${Date.now()}`,
          title: '',
          objectives: [''],
          materials: []
        }
      ]
    })
  }

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    setCourseData({
      ...courseData,
      lessons: courseData.lessons.map(lesson =>
        lesson.id === lessonId ? { ...lesson, ...updates } : lesson
      )
    })
  }

  const removeLesson = (lessonId: string) => {
    setCourseData({
      ...courseData,
      lessons: courseData.lessons.filter(lesson => lesson.id !== lessonId)
    })
  }

  const addObjective = (lessonId: string) => {
    const lesson = courseData.lessons.find(l => l.id === lessonId)
    if (lesson) {
      updateLesson(lessonId, {
        objectives: [...lesson.objectives, '']
      })
    }
  }

  const updateObjective = (lessonId: string, index: number, value: string) => {
    const lesson = courseData.lessons.find(l => l.id === lessonId)
    if (lesson) {
      const newObjectives = [...lesson.objectives]
      newObjectives[index] = value
      updateLesson(lessonId, { objectives: newObjectives })
    }
  }

  const removeObjective = (lessonId: string, index: number) => {
    const lesson = courseData.lessons.find(l => l.id === lessonId)
    if (lesson && lesson.objectives.length > 1) {
      updateLesson(lessonId, {
        objectives: lesson.objectives.filter((_, i) => i !== index)
      })
    }
  }

  const addMaterial = (lessonId: string, type: Material['type']) => {
    const lesson = courseData.lessons.find(l => l.id === lessonId)
    if (lesson) {
      updateLesson(lessonId, {
        materials: [
          ...lesson.materials,
          {
            id: `material-${Date.now()}`,
            type,
            title: '',
            url: ''
          }
        ]
      })
    }
  }

  const updateMaterial = (lessonId: string, materialId: string, updates: Partial<Material>) => {
    const lesson = courseData.lessons.find(l => l.id === lessonId)
    if (lesson) {
      updateLesson(lessonId, {
        materials: lesson.materials.map(material =>
          material.id === materialId ? { ...material, ...updates } : material
        )
      })
    }
  }

  const removeMaterial = (lessonId: string, materialId: string) => {
    const lesson = courseData.lessons.find(l => l.id === lessonId)
    if (lesson) {
      updateLesson(lessonId, {
        materials: lesson.materials.filter(material => material.id !== materialId)
      })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/courses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...courseData,
          upload_method: 'topic-based'
        })
      })

      if (!response.ok) throw new Error('Failed to create course')

      setSuccess(true)
      setTimeout(() => {
        router.push('/professor/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Failed to create course. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getMaterialIcon = (type: Material['type']) => {
    switch (type) {
      case 'video': return Youtube
      case 'document': return FileText
      case 'link': return LinkIcon
    }
  }

  return (
    <div className="min-h-screen aurora-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? router.back() : setStep(step - 1)}
            className="glass-panel hover:glass-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-light text-gradient-gold">
              Topic-Based Upload
            </h1>
            <p className="text-white/60">
              Step {step} of 2: {step === 1 ? 'Course Details' : 'Lessons & Materials'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Course Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass-panel p-8">
                <h2 className="text-2xl font-light text-white mb-6">Course Information</h2>

                <div className="space-y-6">
                  {/* Course Title */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={courseData.title}
                      onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                      placeholder="e.g., Introduction to Psychology"
                      className="w-full px-4 py-3 glass-panel text-white placeholder-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>

                  {/* Course Description */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">
                      Course Description
                    </label>
                    <textarea
                      value={courseData.description}
                      onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                      placeholder="Brief overview of what students will learn..."
                      rows={4}
                      className="w-full px-4 py-3 glass-panel text-white placeholder-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!courseData.title.trim()}
                    className="glass-panel-heavy hover:glass-hover border-white/20 text-white px-8 py-6 h-auto shadow-glow-gold luxury-transition group"
                  >
                    <span className="flex items-center gap-3">
                      Next: Add Lessons
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Lessons & Materials */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Lessons */}
              {courseData.lessons.map((lesson, lessonIndex) => (
                <Card key={lesson.id} className="glass-panel p-6">
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-xl font-light text-white">
                      Lesson {lessonIndex + 1}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLesson(lesson.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Lesson Title */}
                  <div className="mb-4">
                    <label className="block text-sm text-white/80 mb-2">
                      Lesson Title *
                    </label>
                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                      placeholder="e.g., Introduction to Cognitive Psychology"
                      className="w-full px-4 py-2 glass-panel-light text-white placeholder-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>

                  {/* Learning Objectives */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-white/80">
                        Learning Objectives
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addObjective(lesson.id)}
                        className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Objective
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {lesson.objectives.map((objective, objIndex) => (
                        <div key={objIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={objective}
                            onChange={(e) => updateObjective(lesson.id, objIndex, e.target.value)}
                            placeholder="Students will be able to..."
                            className="flex-1 px-4 py-2 glass-panel-light text-white placeholder-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                          />
                          {lesson.objectives.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeObjective(lesson.id, objIndex)}
                              className="text-white/60 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm text-white/80">
                        Materials
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addMaterial(lesson.id, 'video')}
                          className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        >
                          <Youtube className="w-4 h-4 mr-1" />
                          Video
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addMaterial(lesson.id, 'document')}
                          className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Document
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addMaterial(lesson.id, 'link')}
                          className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          Link
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {lesson.materials.map((material) => {
                        const Icon = getMaterialIcon(material.type)
                        return (
                          <div key={material.id} className="flex items-start gap-3 glass-panel-light p-4 rounded-lg">
                            <Icon className="w-5 h-5 text-[#D4AF37] mt-2 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={material.title}
                                onChange={(e) => updateMaterial(lesson.id, material.id, { title: e.target.value })}
                                placeholder="Material title"
                                className="w-full px-3 py-1.5 bg-white/5 text-white placeholder-white/40 rounded focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                              />
                              <input
                                type="text"
                                value={material.url}
                                onChange={(e) => updateMaterial(lesson.id, material.id, { url: e.target.value })}
                                placeholder={
                                  material.type === 'video' ? 'YouTube URL' :
                                  material.type === 'document' ? 'Document URL' :
                                  'Web link URL'
                                }
                                className="w-full px-3 py-1.5 bg-white/5 text-white placeholder-white/40 rounded focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterial(lesson.id, material.id)}
                              className="text-white/60 hover:text-red-400 mt-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      })}
                      {lesson.materials.length === 0 && (
                        <p className="text-white/40 text-sm text-center py-4">
                          No materials yet. Click the buttons above to add videos, documents, or links.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Add Lesson Button */}
              <Button
                onClick={addLesson}
                variant="outline"
                className="w-full glass-panel hover:glass-hover border-dashed border-2 border-white/20 text-white py-8 luxury-transition group"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Add Another Lesson
              </Button>

              {/* Submit */}
              <div className="flex justify-end gap-4 mt-8">
                <Button
                  onClick={handleSubmit}
                  disabled={courseData.lessons.length === 0 || saving || success}
                  className="glass-panel-heavy hover:glass-hover border-white/20 text-white px-10 py-6 h-auto shadow-glow-gold luxury-transition group"
                >
                  {success ? (
                    <span className="flex items-center gap-3">
                      <Check className="w-5 h-5" />
                      Course Created!
                    </span>
                  ) : saving ? (
                    <span className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Creating Course...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      Create Course
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
