import { LTIlaunchData, UserRole } from '@/types/user'

export function parseLTIRoles(roles: string[]): UserRole {
  const roleString = roles.join(',').toLowerCase()

  if (roleString.includes('instructor') || roleString.includes('teacher')) {
    return 'teacher'
  }

  return 'student'
}

export function validateLTIRequest(request: Request): LTIlaunchData | null {
  // Simplified for MVP - in production, verify JWT signature from Canvas
  try {
    const formData = new URLSearchParams(request.body as any)

    return {
      canvas_user_id: formData.get('user_id') || '',
      name: formData.get('lis_person_name_full') || '',
      email: formData.get('lis_person_contact_email_primary') || '',
      roles: (formData.get('roles') || '').split(','),
      course_id: formData.get('context_id') || '',
      context_title: formData.get('context_title') || '',
    }
  } catch {
    return null
  }
}
