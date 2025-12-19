/**
 * Canvas LMS API Client
 * Handles communication with Canvas REST API
 */

export interface CanvasCourse {
  id: number
  name: string
  course_code: string
  workflow_state: string
  start_at: string | null
  end_at: string | null
  total_students?: number
}

export interface CanvasModule {
  id: number
  name: string
  position: number
  unlock_at: string | null
  require_sequential_progress: boolean
  items_count: number
  items_url: string
  state: string
}

export interface CanvasModuleItem {
  id: number
  title: string
  position: number
  indent: number
  type: 'File' | 'Page' | 'Discussion' | 'Assignment' | 'Quiz' | 'SubHeader' | 'ExternalUrl' | 'ExternalTool'
  content_id?: number
  html_url?: string
  url?: string
  page_url?: string
  external_url?: string
}

export interface CanvasPage {
  url: string
  title: string
  body: string
  created_at: string
  updated_at: string
}

export interface CanvasFile {
  id: number
  display_name: string
  filename: string
  url: string
  size: number
  content_type: string
}

export class CanvasClient {
  private instanceUrl: string
  private accessToken: string

  constructor(instanceUrl: string, accessToken: string) {
    // Normalize the instance URL
    this.instanceUrl = instanceUrl.replace(/\/$/, '')
    this.accessToken = accessToken
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.instanceUrl}/api/v1${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Canvas API error ${response.status}: ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get all courses for the current user
   */
  async getCourses(): Promise<CanvasCourse[]> {
    return this.request<CanvasCourse[]>('/courses?enrollment_type=teacher&state[]=available&per_page=50')
  }

  /**
   * Get a specific course by ID
   */
  async getCourse(courseId: number): Promise<CanvasCourse> {
    return this.request<CanvasCourse>(`/courses/${courseId}`)
  }

  /**
   * Get all modules for a course
   */
  async getCourseModules(courseId: number): Promise<CanvasModule[]> {
    return this.request<CanvasModule[]>(`/courses/${courseId}/modules?per_page=50`)
  }

  /**
   * Get all items in a module
   */
  async getModuleItems(courseId: number, moduleId: number): Promise<CanvasModuleItem[]> {
    return this.request<CanvasModuleItem[]>(`/courses/${courseId}/modules/${moduleId}/items?per_page=100`)
  }

  /**
   * Get a page by URL
   */
  async getPage(courseId: number, pageUrl: string): Promise<CanvasPage> {
    return this.request<CanvasPage>(`/courses/${courseId}/pages/${pageUrl}`)
  }

  /**
   * Get file information
   */
  async getFile(fileId: number): Promise<CanvasFile> {
    return this.request<CanvasFile>(`/files/${fileId}`)
  }

  /**
   * Submit a grade for an assignment
   */
  async submitGrade(
    courseId: number,
    assignmentId: number,
    userId: string,
    grade: number,
    comment?: string
  ): Promise<void> {
    await this.request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        submission: {
          posted_grade: grade.toString(),
        },
        comment: comment ? { text_comment: comment } : undefined,
      }),
    })
  }

  /**
   * Test the connection to Canvas
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request<{ id: number }>('/users/self')
      return true
    } catch {
      return false
    }
  }
}

/**
 * Create a Canvas client from stored token
 */
export function createCanvasClient(instanceUrl: string, accessToken: string): CanvasClient {
  return new CanvasClient(instanceUrl, accessToken)
}
