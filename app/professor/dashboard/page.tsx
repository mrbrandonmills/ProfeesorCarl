'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  BookOpen,
  Users,
  TrendingUp,
  Zap,
  Clock,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Link2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description: string
  uploadMethod: string
  lessonCount: number
  studentCount: number
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalCourses: number
  totalStudents: number
  totalSessions: number
  avgEngagement: number
  totalBreakthroughs: number
  totalLearningTimeMinutes: number
}

export default function ProfessorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [canvasConnected, setCanvasConnected] = useState(false)
  const [canvasLoading, setCanvasLoading] = useState(false)
  const [canvasCourses, setCanvasCourses] = useState<any[]>([])
  const [canvasError, setCanvasError] = useState<string | null>(null)
  const [syncingCourse, setSyncingCourse] = useState<number | null>(null)

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      // Check authorization
      const authResponse = await fetch('/api/auth/session')
      const authData = await authResponse.json()

      if (!authResponse.ok || !authData.user) {
        router.push('/login')
        return
      }

      if (authData.user.role !== 'teacher') {
        router.push('/chat')
        return
      }

      setAuthorized(true)

      // Fetch courses and stats in parallel
      const [coursesRes, statsRes] = await Promise.all([
        fetch('/api/professor/courses'),
        fetch('/api/professor/stats')
      ])

      const coursesData = await coursesRes.json()
      const statsData = await statsRes.json()

      if (coursesData.success) {
        setCourses(coursesData.courses)
      }

      if (statsData.success) {
        setStats(statsData.stats)
      }

    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Check Canvas connection and load Canvas courses
  const checkCanvasConnection = async () => {
    setCanvasLoading(true)
    setCanvasError(null)

    try {
      const response = await fetch('/api/canvas/oauth')
      const data = await response.json()

      if (data.connected) {
        setCanvasConnected(true)
        await loadCanvasCourses()
      } else if (data.error?.includes('not configured')) {
        setCanvasError('Canvas integration is not configured for this instance.')
      } else {
        setCanvasConnected(false)
      }
    } catch (err) {
      console.error('Canvas check error:', err)
      setCanvasError('Failed to check Canvas connection')
    } finally {
      setCanvasLoading(false)
    }
  }

  const loadCanvasCourses = async () => {
    try {
      const response = await fetch('/api/canvas/courses')
      const data = await response.json()

      if (data.success) {
        setCanvasCourses(data.courses)
      } else if (data.needsAuth) {
        setCanvasConnected(false)
      }
    } catch (err) {
      console.error('Failed to load Canvas courses:', err)
    }
  }

  const connectCanvas = async () => {
    try {
      const response = await fetch('/api/canvas/oauth')
      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else if (data.error) {
        setCanvasError(data.message || data.error)
      }
    } catch (err) {
      setCanvasError('Failed to initiate Canvas connection')
    }
  }

  const disconnectCanvas = async () => {
    try {
      await fetch('/api/canvas/oauth', { method: 'DELETE' })
      setCanvasConnected(false)
      setCanvasCourses([])
    } catch (err) {
      console.error('Failed to disconnect Canvas:', err)
    }
  }

  const syncCanvasCourse = async (courseId: number, courseName: string) => {
    setSyncingCourse(courseId)

    try {
      const response = await fetch(`/api/canvas/courses/${courseId}/sync`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        // Refresh local courses
        const coursesRes = await fetch('/api/professor/courses')
        const coursesData = await coursesRes.json()
        if (coursesData.success) {
          setCourses(coursesData.courses)
        }
        alert(`Successfully imported "${courseName}"!\n\nModules: ${data.stats.modulesImported}\nLessons: ${data.stats.lessonsCreated}\nMaterials: ${data.stats.materialsCreated}`)
      } else {
        alert(`Failed to sync course: ${data.error}`)
      }
    } catch (err) {
      console.error('Course sync error:', err)
      alert('Failed to sync course')
    } finally {
      setSyncingCourse(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex justify-between items-start"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Professor Dashboard
            </h1>
            <p className="text-slate-600">
              Manage your courses and track student progress
            </p>
          </div>
          <Link href="/professor/upload">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30">
              <Plus className="w-4 h-4 mr-2" />
              New Course
            </Button>
          </Link>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalCourses}</p>
                  <p className="text-sm text-slate-600">Courses</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
                  <p className="text-sm text-slate-600">Students</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalBreakthroughs}</p>
                  <p className="text-sm text-slate-600">Breakthroughs</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalLearningTimeMinutes}</p>
                  <p className="text-sm text-slate-600">Minutes</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="canvas" onClick={() => checkCanvasConnection()}>Canvas Import</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-0">
              {courses.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses yet</h3>
                  <p className="text-slate-600 mb-6">Create your first course to get started with Professor Carl</p>
                  <Link href="/professor/upload">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                            {course.title}
                          </h3>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {course.description && (
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {course.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course.lessonCount} lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {course.studentCount} students
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <span className="text-xs text-slate-400">
                            Created {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="canvas" className="mt-0">
              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Link2 className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-slate-900">Canvas Integration</h3>
                  </div>
                  {canvasConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectCanvas}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  )}
                </div>

                {canvasLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-3 text-slate-600">Checking Canvas connection...</span>
                  </div>
                ) : canvasError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">{canvasError}</p>
                    <Button variant="outline" onClick={() => checkCanvasConnection()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : !canvasConnected ? (
                  <div className="text-center py-8">
                    <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-900 mb-2">Connect to Canvas LMS</h4>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Import your existing Canvas courses directly into Professor Carl to create AI-powered learning experiences.
                    </p>
                    <Button
                      onClick={connectCanvas}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect Canvas
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-6 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Canvas Connected</span>
                    </div>

                    {canvasCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-600">No courses found in your Canvas account.</p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-medium text-slate-600 mb-4">
                          Select a course to import ({canvasCourses.length} courses available)
                        </h4>
                        <div className="space-y-3">
                          {canvasCourses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                            >
                              <div>
                                <h5 className="font-medium text-slate-900">{course.name}</h5>
                                <p className="text-sm text-slate-500">{course.courseCode}</p>
                              </div>
                              <Button
                                onClick={() => syncCanvasCourse(course.id, course.name)}
                                disabled={syncingCourse === course.id}
                                variant="outline"
                                size="sm"
                              >
                                {syncingCourse === course.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Importing...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Import
                                  </>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-slate-900">Student Analytics</h3>
                </div>

                {stats && stats.totalSessions > 0 ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-4">Overview</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Total Sessions</span>
                          <span className="font-semibold text-slate-900">{stats.totalSessions}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Avg Engagement</span>
                          <span className="font-semibold text-slate-900">{(stats.avgEngagement * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Total Breakthroughs</span>
                          <span className="font-semibold text-slate-900">{stats.totalBreakthroughs}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-4">Engagement Score</h4>
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {(stats.avgEngagement * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-blue-100">
                          <div
                            style={{ width: `${stats.avgEngagement * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No analytics data yet. Data will appear once students start using your courses.</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
