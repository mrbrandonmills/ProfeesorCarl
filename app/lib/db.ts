/**
 * Database connection utility for Professor Carl Teacher Dashboard
 * Uses Vercel Postgres
 */

import { sql } from '@vercel/postgres';

// Teacher queries
export async function createTeacher(
  email: string,
  name: string,
  passwordHash: string,
  schoolDistrict?: string
) {
  const result = await sql`
    INSERT INTO teachers (email, name, password_hash, school_district)
    VALUES (${email}, ${name}, ${passwordHash}, ${schoolDistrict})
    RETURNING id, email, name, school_district, role, created_at
  `;
  return result.rows[0];
}

export async function getTeacherByEmail(email: string) {
  const result = await sql`
    SELECT id, email, name, school_district, password_hash, role, created_at, last_login
    FROM teachers
    WHERE email = ${email}
  `;
  return result.rows[0];
}

export async function updateTeacherLastLogin(teacherId: string) {
  await sql`
    UPDATE teachers
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = ${teacherId}
  `;
}

// Class queries
export async function createClass(
  teacherId: string,
  name: string,
  gradeLevel?: string,
  subject?: string,
  schoolYear?: string
) {
  const result = await sql`
    INSERT INTO classes (teacher_id, name, grade_level, subject, school_year)
    VALUES (${teacherId}, ${name}, ${gradeLevel}, ${subject}, ${schoolYear})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getTeacherClasses(teacherId: string) {
  const result = await sql`
    SELECT c.*, COUNT(s.id) as student_count
    FROM classes c
    LEFT JOIN students s ON c.id = s.class_id
    WHERE c.teacher_id = ${teacherId}
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  return result.rows;
}

// Student queries
export async function createStudent(
  classId: string,
  firstName?: string,
  lastName?: string,
  parentEmail?: string
) {
  const result = await sql`
    INSERT INTO students (class_id, first_name, last_name, parent_email, access_code)
    VALUES (${classId}, ${firstName}, ${lastName}, ${parentEmail}, generate_access_code())
    RETURNING *
  `;
  return result.rows[0];
}

export async function getStudentByAccessCode(accessCode: string) {
  const result = await sql`
    SELECT s.*, c.teacher_id, c.name as class_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.access_code = ${accessCode}
  `;
  return result.rows[0];
}

export async function getClassStudents(classId: string) {
  const result = await sql`
    SELECT s.*,
      COUNT(DISTINCT sess.id) as total_sessions,
      COALESCE(AVG(sess.engagement_score), 0) as avg_engagement
    FROM students s
    LEFT JOIN sessions sess ON s.id = sess.student_id
    WHERE s.class_id = ${classId}
    GROUP BY s.id
    ORDER BY s.last_name, s.first_name
  `;
  return result.rows;
}

// Session queries
export async function createSession(studentId: string, lessonPlanId?: string) {
  const result = await sql`
    INSERT INTO sessions (student_id, lesson_plan_id)
    VALUES (${studentId}, ${lessonPlanId})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateSession(
  sessionId: string,
  sessionState: Record<string, unknown>,
  topicsDiscussed: string[],
  integrityScore?: number,
  engagementScore?: number
) {
  const result = await sql`
    UPDATE sessions
    SET
      session_state = ${JSON.stringify(sessionState)},
      topics_discussed = ${JSON.stringify(topicsDiscussed)},
      integrity_score = ${integrityScore},
      engagement_score = ${engagementScore},
      ended_at = CURRENT_TIMESTAMP,
      duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))
    WHERE id = ${sessionId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function addSessionMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>
) {
  const result = await sql`
    INSERT INTO session_messages (session_id, role, content, metadata)
    VALUES (${sessionId}, ${role}, ${content}, ${JSON.stringify(metadata || {})})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getSessionMessages(sessionId: string) {
  const result = await sql`
    SELECT *
    FROM session_messages
    WHERE session_id = ${sessionId}
    ORDER BY timestamp ASC
  `;
  return result.rows;
}

// Analytics queries
export async function getStudentSessions(studentId: string, limit = 20) {
  const result = await sql`
    SELECT *
    FROM sessions
    WHERE student_id = ${studentId}
    ORDER BY started_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

export async function getClassAnalytics(classId: string) {
  const result = await sql`
    SELECT
      COUNT(DISTINCT s.id) as total_students,
      COUNT(DISTINCT sess.id) as total_sessions,
      COALESCE(AVG(sess.engagement_score), 0) as avg_engagement,
      COALESCE(AVG(sess.integrity_score), 0) as avg_integrity,
      COALESCE(SUM(sess.duration_seconds), 0) / 3600 as total_hours
    FROM students s
    LEFT JOIN sessions sess ON s.id = sess.student_id
    WHERE s.class_id = ${classId}
  `;
  return result.rows[0];
}

// Lesson plan queries
export async function createLessonPlan(
  teacherId: string,
  title: string,
  contentText: string,
  fileUrl?: string,
  classId?: string
) {
  const result = await sql`
    INSERT INTO lesson_plans (teacher_id, class_id, title, content_text, file_url)
    VALUES (${teacherId}, ${classId}, ${title}, ${contentText}, ${fileUrl})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getTeacherLessonPlans(teacherId: string) {
  const result = await sql`
    SELECT lp.*, c.name as class_name
    FROM lesson_plans lp
    LEFT JOIN classes c ON lp.class_id = c.id
    WHERE lp.teacher_id = ${teacherId}
    ORDER BY lp.created_at DESC
  `;
  return result.rows;
}

// Integrity flag queries
export async function createIntegrityFlag(
  sessionId: string,
  studentId: string,
  flagType: string,
  severity: string,
  details: Record<string, unknown>
) {
  const result = await sql`
    INSERT INTO integrity_flags (session_id, student_id, flag_type, severity, details)
    VALUES (${sessionId}, ${studentId}, ${flagType}, ${severity}, ${JSON.stringify(details)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getUnreviewedFlags(teacherId: string) {
  const result = await sql`
    SELECT f.*, s.first_name, s.last_name, s.access_code, c.name as class_name
    FROM integrity_flags f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE c.teacher_id = ${teacherId}
      AND f.reviewed_by_teacher = FALSE
    ORDER BY f.created_at DESC
  `;
  return result.rows;
}

export async function markFlagReviewed(flagId: string) {
  await sql`
    UPDATE integrity_flags
    SET reviewed_by_teacher = TRUE
    WHERE id = ${flagId}
  `;
}
