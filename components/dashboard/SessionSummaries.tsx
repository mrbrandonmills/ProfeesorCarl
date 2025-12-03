'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function SessionSummaries() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient-blue-purple">
            <Info className="w-5 h-5" />
            Student Analytics
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Coming soon in Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="glass-panel p-6 rounded-lg inline-block">
              <p className="text-foreground/70 mb-2">
                Session summaries and student analytics will be available soon.
              </p>
              <p className="text-sm text-muted-foreground">
                Track student progress, view comprehension levels, and analyze learning patterns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
