import { NextResponse } from 'next/server';
import { createTeacher, getTeacherByEmail } from '@/app/lib/db';
import {
  hashPassword,
  createSessionToken,
  setSessionCookie,
  isValidEmail,
  isValidPassword,
} from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, name, password, schoolDistrict } = await request.json();

    // Validation
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if teacher already exists
    const existingTeacher = await getTeacherByEmail(email);
    if (existingTeacher) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create teacher
    const teacher = await createTeacher(
      email,
      name,
      passwordHash,
      schoolDistrict || null
    );

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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
