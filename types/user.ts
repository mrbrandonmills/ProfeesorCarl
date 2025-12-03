export type UserRole = 'student' | 'teacher'

export interface User {
  id: string
  canvas_id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface LTIlaunchData {
  canvas_user_id: string
  name: string
  email: string
  roles: string[]
  course_id: string
  context_title: string
}
