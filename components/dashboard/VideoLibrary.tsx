'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Library, Clock, Eye, ThumbsUp, Loader2, AlertCircle } from 'lucide-react';

interface Video {
  id: string;
  video_id: string;
  title: string;
  duration: number;
  topics: string[];
  difficulty_level: 'intro' | 'intermediate' | 'advanced';
  key_concepts: string[];
  view_count: number;
  helpful_count: number;
  created_at: string;
}

export default function VideoLibrary() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/videos/library');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos');
      }

      setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video library');
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

  const getThumbnailUrl = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <Card className="glass-panel border-white/10">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-muted-foreground">Loading video library...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <Card className="glass-panel border-white/10">
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="glass-panel p-4 border-red-500/20 bg-red-500/5 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

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
            <Library className="w-5 h-5" />
            Video Library
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {videos.length === 0
              ? 'No videos yet. Upload your first video to get started!'
              : `${videos.length} video${videos.length === 1 ? '' : 's'} in your library`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="glass-panel p-6 rounded-lg inline-block">
                <Library className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-foreground/70 mb-2">Your video library is empty</p>
                <p className="text-sm text-muted-foreground">
                  Upload videos from the &quot;Upload Video&quot; tab to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="glass-panel glass-hover h-full rounded-lg overflow-hidden group cursor-pointer transition-all hover:shadow-glow-blue">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-black/20 overflow-hidden">
                      <img
                        src={getThumbnailUrl(video.video_id)}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(video.duration)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Title */}
                      <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
                        {video.title}
                      </h3>

                      {/* Difficulty */}
                      <div className="flex items-center gap-2">
                        <Badge variant={getDifficultyColor(video.difficulty_level)} className="text-xs">
                          {video.difficulty_level}
                        </Badge>
                      </div>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-1">
                        {video.topics.slice(0, 3).map((topic, topicIndex) => (
                          <Badge
                            key={topicIndex}
                            variant="outline"
                            className="glass-panel text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                        {video.topics.length > 3 && (
                          <Badge variant="outline" className="glass-panel text-xs">
                            +{video.topics.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{video.view_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{video.helpful_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
