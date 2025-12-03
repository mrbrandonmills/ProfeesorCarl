'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoUpload from '@/components/dashboard/VideoUpload';
import VideoLibrary from '@/components/dashboard/VideoLibrary';
import SessionSummaries from '@/components/dashboard/SessionSummaries';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (!response.ok || !data.user) {
        // Not authenticated
        router.push('/onboarding');
        return;
      }

      if (data.user.role !== 'teacher') {
        // Not a teacher
        router.push('/chat');
        return;
      }

      setAuthorized(true);
    } catch (error) {
      console.error('Authorization check failed:', error);
      router.push('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] aurora-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] aurora-bg">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient-blue-purple mb-2">
            Professor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your teaching content and track student progress
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs defaultValue="library" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="library">Video Library</TabsTrigger>
              <TabsTrigger value="upload">Upload Video</TabsTrigger>
              <TabsTrigger value="analytics">Student Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-0">
              <VideoLibrary />
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <VideoUpload />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <SessionSummaries />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
