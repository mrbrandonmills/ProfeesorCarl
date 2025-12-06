'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Clock, ArrowRight, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  title: string
  description: string
  teacher_name: string
  lesson_count: number
  enrolled_count: number
  is_enrolled: boolean
}

export default function CatalogPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses/catalog')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })

      if (response.ok) {
        // Update local state
        setCourses(courses.map(course =>
          course.id === courseId
            ? { ...course, is_enrolled: true, enrolled_count: course.enrolled_count + 1 }
            : course
        ))
      }
    } catch (error) {
      console.error('Failed to enroll:', error)
      alert('Failed to enroll in course')
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading courses...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen aurora-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gradient-gold mb-3">
            Course Catalog
          </h1>
          <p className="text-white/60 text-lg">
            Explore courses and start learning with Professor Carl
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-12 pr-4 py-3 glass-panel text-white placeholder-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">
              {searchQuery ? 'No courses match your search' : 'No courses available yet'}
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="glass-panel p-6 h-full flex flex-col group hover:glass-hover luxury-transition">
                  {/* Course Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-light text-white mb-3 group-hover:text-gradient-gold transition-colors duration-300">
                      {course.title}
                    </h3>

                    {course.description && (
                      <p className="text-white/60 mb-6 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{course.teacher_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.lesson_count} lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{course.enrolled_count} students</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  {course.is_enrolled ? (
                    <Button
                      onClick={() => router.push(`/course/${course.id}`)}
                      className="w-full glass-panel-heavy hover:glass-hover border-white/20 text-white py-6 shadow-glow-gold luxury-transition group/btn"
                    >
                      <span className="flex items-center justify-center gap-2">
                        Continue Learning
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEnroll(course.id)}
                      variant="outline"
                      className="w-full glass-panel hover:glass-hover border-white/20 text-white py-6 luxury-transition group/btn"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <BookOpen className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                        Enroll Now
                      </span>
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State for No Courses */}
        {courses.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <Card className="glass-panel-light p-6 text-center">
              <BookOpen className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
              <h3 className="text-xl font-light text-white mb-2">
                No Courses Available Yet
              </h3>
              <p className="text-white/60 mb-6">
                Courses will appear here once professors upload their content
              </p>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
