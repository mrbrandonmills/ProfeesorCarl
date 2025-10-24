'use client';

import { useState } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  description?: string;
}

/**
 * YouTube Video Embed Component
 *
 * Safely embeds YouTube videos with error handling and fallback
 * If it fails, it doesn't break the rest of the UI
 */
export default function YouTubeEmbed({ videoId, title, description }: YouTubeEmbedProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  console.log('[YouTubeEmbed] Rendering with videoId:', videoId, 'title:', title);

  if (hasError) {
    // Graceful failure - show helpful search suggestion
    const searchQuery = title ? title.replace('Video: ', '') : 'educational video';
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    return (
      <div className="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📺</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Video Suggestion: {title || 'Educational Resource'}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              This video couldn&apos;t be embedded, but you can find helpful videos on this topic:
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                🔍 Search YouTube for &quot;{searchQuery}&quot; →
              </a>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> After watching, come back here and let&apos;s discuss what you learned!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      {/* Video Header */}
      {(title || description) && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              📺 {title}
            </h4>
          )}
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Video Player */}
      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              Loading video...
            </div>
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || 'Educational Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
        >
          Open in YouTube →
        </a>
      </div>
    </div>
  );
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
