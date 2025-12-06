'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function DashboardTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activateMockSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mock-teacher-session', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to activate mock session');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg max-w-md">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard Testing
            </CardTitle>
            <CardDescription className="text-slate-600">
              Activate a mock teacher session to test the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm p-4 border border-red-200/50 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              onClick={activateMockSession}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? 'Activating...' : 'Activate Mock Teacher Session'}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              This will set a mock session cookie and redirect you to the dashboard
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
