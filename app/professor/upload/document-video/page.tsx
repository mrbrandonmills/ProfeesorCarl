'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Upload,
  FileText,
  Youtube,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ExtractedLesson {
  title: string
  objectives: string[]
  videoUrl: string
}

interface ExtractionResult {
  courseTitle: string
  courseDescription: string
  lessons: ExtractedLesson[]
}

export default function DocumentVideoUploadPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or DOCX file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setDocumentFile(file)
      setError(null)
    }
  }

  const handleExtract = async () => {
    if (!documentFile) return

    setExtracting(true)
    setError(null)

    try {
      // Upload file
      const formData = new FormData()
      formData.append('document', documentFile)

      const response = await fetch('/api/courses/extract-from-document', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to extract course structure')
      }

      const data = await response.json()
      setExtractedData(data)
    } catch (err) {
      console.error('Extraction error:', err)
      setError((err as Error).message)
    } finally {
      setExtracting(false)
    }
  }

  const updateLesson = (index: number, field: keyof ExtractedLesson, value: string) => {
    if (!extractedData) return

    const newLessons = [...extractedData.lessons]
    newLessons[index] = { ...newLessons[index], [field]: value }
    setExtractedData({ ...extractedData, lessons: newLessons })
  }

  const handleSubmit = async () => {
    if (!extractedData) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/courses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: extractedData.courseTitle,
          description: extractedData.courseDescription,
          upload_method: 'document-video',
          lessons: extractedData.lessons.map((lesson, index) => ({
            title: lesson.title,
            objectives: lesson.objectives,
            materials: lesson.videoUrl ? [{
              type: 'video',
              title: `${lesson.title} - Video`,
              url: lesson.videoUrl
            }] : []
          }))
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create course')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/professor/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Save error:', err)
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="bg-white/80 backdrop-blur-xl border border-slate-200/50 hover:bg-white hover:border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Document + Video Upload
            </h1>
            <p className="text-slate-600">
              Upload your syllabus or lesson plan and link YouTube videos
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {!extractedData ? (
          /* Step 1: Upload Document */
          <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-light text-slate-900 mb-3">
                Upload Course Document
              </h2>
              <p className="text-slate-600 mb-8">
                Upload a PDF or DOCX containing your course syllabus, lesson plans, or curriculum outline.
                Our AI will extract the course structure automatically.
              </p>

              {/* File Input */}
              <div className="mb-6">
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className={`cursor-pointer bg-white border-2 border-dashed p-8 rounded-xl transition-all duration-300 ${
                    documentFile
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50/50'
                  }`}>
                    {documentFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <Check className="w-5 h-5 text-blue-600" />
                        <span className="text-slate-900">{documentFile.name}</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-slate-700">Click to select file</p>
                        <p className="text-slate-500 text-sm mt-1">PDF or DOCX • Max 10MB</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Extract Button */}
              <Button
                onClick={handleExtract}
                disabled={!documentFile || extracting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 h-auto shadow-lg shadow-blue-500/30 transition-all duration-300 group border-0"
              >
                {extracting ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Extracting Course Structure...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    Extract with AI
                  </span>
                )}
              </Button>

              {/* Info */}
              <div className="mt-8 text-left bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-900 mb-2">
                  💡 What AI Extracts:
                </h4>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>• Course title and description</li>
                  <li>• Lesson topics and sequence</li>
                  <li>• Learning objectives per lesson</li>
                  <li>• Suggested structure for YouTube videos</li>
                </ul>
              </div>
            </div>
          </Card>
        ) : (
          /* Step 2: Review & Add Videos */
          <div className="space-y-6">
            {/* Course Info */}
            <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-6">
              <h2 className="text-xl font-light text-slate-900 mb-4">Course Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-700 font-medium mb-2">Course Title</label>
                  <input
                    type="text"
                    value={extractedData.courseTitle}
                    onChange={(e) => setExtractedData({ ...extractedData, courseTitle: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 font-medium mb-2">Description</label>
                  <textarea
                    value={extractedData.courseDescription}
                    onChange={(e) => setExtractedData({ ...extractedData, courseDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                  />
                </div>
              </div>
            </Card>

            {/* Lessons */}
            <div className="space-y-4">
              <h2 className="text-xl font-light text-slate-900">Lessons ({extractedData.lessons.length})</h2>
              {extractedData.lessons.map((lesson, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg p-6">
                  <h3 className="text-lg font-light text-slate-900 mb-4">
                    Lesson {index + 1}: {lesson.title}
                  </h3>

                  {/* Objectives */}
                  <div className="mb-4">
                    <label className="block text-sm text-slate-700 font-medium mb-2">Learning Objectives</label>
                    <div className="space-y-1">
                      {lesson.objectives.map((obj, i) => (
                        <p key={i} className="text-slate-600 text-sm">• {obj}</p>
                      ))}
                    </div>
                  </div>

                  {/* YouTube Link */}
                  <div>
                    <label className="block text-sm text-slate-700 font-medium mb-2">
                      <Youtube className="w-4 h-4 inline mr-1" />
                      YouTube Video (Optional)
                    </label>
                    <input
                      type="text"
                      value={lesson.videoUrl}
                      onChange={(e) => updateLesson(index, 'videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </Card>
              ))}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setExtractedData(null)}
                className="bg-white/80 backdrop-blur-xl border border-slate-300 hover:bg-white hover:border-slate-400 text-slate-700 px-6 py-3"
              >
                Start Over
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || success}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-6 h-auto shadow-lg shadow-blue-500/30 transition-all duration-300 group border-0"
              >
                {success ? (
                  <span className="flex items-center gap-3">
                    <Check className="w-5 h-5" />
                    Course Created!
                  </span>
                ) : saving ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Course...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    Create Course
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
