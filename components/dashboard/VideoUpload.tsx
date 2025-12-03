'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle, AlertCircle, VideoIcon } from 'lucide-react';

interface VideoAnalysis {
  video_id: string;
  title: string;
  duration: number;
  topics: string[];
  difficulty_level: 'intro' | 'intermediate' | 'advanced';
  key_concepts: string[];
  transcript?: string;
}

export default function VideoUpload() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const analyzeVideo = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/videos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      setAnalysis(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async () => {
    if (!analysis) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/videos/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: analysis.video_id,
          title: analysis.title,
          duration: analysis.duration,
          topics: analysis.topics,
          difficulty_level: analysis.difficulty_level,
          key_concepts: analysis.key_concepts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add video to library');
      }

      setSuccessMessage('Video successfully added to library!');
      setYoutubeUrl('');
      setAnalysis(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add video to library');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'intro':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient-blue-purple">
            <Upload className="w-5 h-5" />
            Upload Video
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Analyze YouTube videos and add them to your teaching library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="youtube-url" className="text-sm font-medium text-foreground">
              YouTube URL
            </label>
            <div className="flex gap-2">
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={loading}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && analyzeVideo()}
              />
              <Button
                onClick={analyzeVideo}
                disabled={loading || !youtubeUrl.trim()}
                className="shadow-glow-blue"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <VideoIcon className="w-4 h-4 mr-2" />
                    Analyze Video
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-4 border-red-500/20 bg-red-500/5"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-4 border-emerald-500/20 bg-emerald-500/5"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-300">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Results */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="glass-panel p-6 space-y-4 border-blue-500/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {analysis.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant={getDifficultyColor(analysis.difficulty_level)}>
                          {analysis.difficulty_level}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(analysis.duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="glass-panel">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Key Concepts</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.key_concepts.map((concept, index) => (
                          <Badge key={index} variant="secondary">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={addToLibrary}
                    disabled={loading}
                    className="w-full shadow-glow-emerald"
                    variant="default"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding to Library...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Add to Library
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Animation */}
          {loading && !analysis && (
            <div className="flex justify-center py-8">
              <div className="flex gap-2">
                <motion.div
                  className="w-3 h-3 bg-blue-500 rounded-full"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-3 h-3 bg-purple-500 rounded-full"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-3 h-3 bg-emerald-500 rounded-full"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
