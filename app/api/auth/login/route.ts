import { NextResponse } from 'next/server';
import { getTeacherByEmail, updateTeacherLastLogin } from '@/app/lib/db';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  isValidEmail,
} from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Get teacher from database
    const teacher = await getTeacherByEmail(email);

    if (!teacher) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, teacher.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await updateTeacherLastLogin(teacher.id);

    // Create session token
    const token = createSessionToken(teacher.id, teacher.email);

    // Set cookie
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        schoolDistrict: teacher.school_district,
        role: teacher.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
