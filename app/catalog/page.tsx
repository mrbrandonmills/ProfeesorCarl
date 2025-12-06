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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading courses...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Course Catalog
          </h1>
          <p className="text-slate-600 text-lg">
            Explore courses and start learning with Professor Carl
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all duration-300"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">
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
                <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-6 h-full flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {/* Course Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-light text-slate-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:via-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {course.title}
                    </h3>

                    {course.description && (
                      <p className="text-slate-600 mb-6 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-700 mb-6">
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
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 group/btn"
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
                      className="w-full bg-white border-2 border-blue-600 text-blue-600 py-6 hover:bg-blue-50 transition-all duration-300 group/btn"
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
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-6 text-center">
              <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-light text-slate-900 mb-2">
                No Courses Available Yet
              </h3>
              <p className="text-slate-600 mb-6">
                Courses will appear here once professors upload their content
              </p>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
