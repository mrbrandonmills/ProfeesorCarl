import { NextResponse } from 'next/server';

// Mock teacher session for testing the dashboard
// In production, use proper LTI authentication

export async function POST() {
  try {
    const mockTeacherSession = {
      user: {
        id: 'mock-teacher-id',
        name: 'Professor Demo',
        email: 'teacher@demo.com',
        role: 'teacher',
      },
      courseId: 'mock-course-id',
    };

    // In production, this would set a proper JWT cookie
    const response = NextResponse.json(mockTeacherSession, { status: 200 });

    // Set a mock session cookie for testing
    response.cookies.set('mock_teacher_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Mock session error:', error);
    return NextResponse.json(
      { error: 'Failed to create mock session' },
      { status: 500 }
    );
  }
}
