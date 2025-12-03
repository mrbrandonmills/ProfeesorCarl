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
    <div className="min-h-screen bg-[#0a0a0f] aurora-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="glass-panel border-white/10 max-w-md">
          <CardHeader>
            <CardTitle className="text-gradient-blue-purple">
              Dashboard Testing
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Activate a mock teacher session to test the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="glass-panel p-4 border-red-500/20 bg-red-500/5">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <Button
              onClick={activateMockSession}
              disabled={loading}
              className="w-full shadow-glow-blue"
            >
              {loading ? 'Activating...' : 'Activate Mock Teacher Session'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This will set a mock session cookie and redirect you to the dashboard
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
