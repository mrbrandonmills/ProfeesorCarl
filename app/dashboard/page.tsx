import { redirect } from 'next/navigation';
import { getSession } from '@/app/lib/auth';
import { getTeacherClasses } from '@/app/lib/db';
import DashboardLayout from './components/DashboardLayout';
import Link from 'next/link';

export default async function TeacherDashboard() {
  // Check authentication
  const session = await getSession();

  if (!session) {
    redirect('/dashboard/login');
  }

  // Get teacher's classes
  const classes = await getTeacherClasses(session.teacherId);

  return (
    <DashboardLayout teacherEmail={session.email}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Here&apos;s what&apos;s happening with your students.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {classes.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {classes.reduce((sum, c) => sum + parseInt(c.student_count || '0'), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Sessions
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  0
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Classes
            </h2>
            <Link
              href="/dashboard/classes/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Class
            </Link>
          </div>

          {classes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No classes yet. Create your first class to get started!
              </p>
              <Link
                href="/dashboard/classes/new"
                className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Your First Class
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/dashboard/classes/${classItem.id}`}
                  className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {classItem.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {classItem.grade_level && (
                          <span>Grade {classItem.grade_level}</span>
                        )}
                        {classItem.subject && <span>• {classItem.subject}</span>}
                        <span>• {classItem.student_count} students</span>
                      </div>
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400">
                      View →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/lessons"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lesson Plans
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload and manage your lesson plans
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/analytics"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View student engagement and progress
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
