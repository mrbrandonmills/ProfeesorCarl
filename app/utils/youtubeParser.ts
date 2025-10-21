/**
 * YouTube Parser
 *
 * Safely detects and extracts YouTube links from Carl's messages
 * Does NOT break if no videos are found - graceful fallback
 */

export interface ParsedVideo {
  videoId: string;
  title?: string;
  description?: string;
  url: string;
}

export interface ParsedMessageWithVideos {
  hasVideos: boolean;
  videos: ParsedVideo[];
  cleanedContent: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Parse YouTube videos from Carl's message
 *
 * Looks for patterns like:
 * [Video: Title](https://youtube.com/watch?v=...)
 * https://youtube.com/watch?v=...
 */
export function parseVideos(message: string): ParsedMessageWithVideos {
  const videos: ParsedVideo[] = [];
  let cleanedContent = message;

  // Pattern 1: Markdown-style links with titles
  // [Video: Title](https://youtube.com/...)
  const markdownPattern = /\[Video:\s*([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\)]+)\)/gi;
  const markdownMatches = [...message.matchAll(markdownPattern)];

  markdownMatches.forEach((match) => {
    const title = match[1].trim();
    const url = match[2];
    const videoId = extractYouTubeId(url);

    if (videoId) {
      videos.push({
        videoId,
        title,
        url,
      });

      // Remove from content
      cleanedContent = cleanedContent.replace(match[0], '');
    }
  });

  // Pattern 2: Plain YouTube URLs
  // Only if not already caught by markdown pattern
  if (videos.length === 0) {
    const urlPattern = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s]+)/gi;
    const urlMatches = [...message.matchAll(urlPattern)];

    urlMatches.forEach((match) => {
      const url = match[1];
      const videoId = extractYouTubeId(url);

      if (videoId) {
        videos.push({
          videoId,
          url,
        });

        // Remove from content
        cleanedContent = cleanedContent.replace(match[0], '');
      }
    });
  }

  return {
    hasVideos: videos.length > 0,
    videos,
    cleanedContent: cleanedContent.trim(),
  };
}

/**
 * Check if YouTube embeds are enabled
 */
export function isYouTubeEnabled(): boolean {
  // Can be disabled via environment variable for safety
  if (typeof window === 'undefined') {
    return true; // Enable by default on server
  }

  // Check if localStorage override exists (for testing)
  try {
    const override = localStorage.getItem('youtube_enabled');
    if (override !== null) {
      return override === 'true';
    }
  } catch {
    // Ignore localStorage errors
  }

  return true; // Enabled by default
}
