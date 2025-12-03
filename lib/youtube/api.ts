// TypeScript stub until googleapis is installed
// Run: npm install googleapis
type GoogleApis = {
  youtube: (config: { version: string; auth: string | undefined }) => any
}

let google: GoogleApis
try {
  const googleapis = require('googleapis')
  google = googleapis.google
} catch {
  // Fallback if googleapis not installed
  google = {
    youtube: () => ({
      videos: {
        list: async () => ({ data: { items: [] } }),
      },
    }),
  }
}

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
})

/**
 * Extract video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT15M33S -> 933 seconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Get video metadata from YouTube API
 */
export async function getVideoMetadata(videoId: string) {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    })

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found')
    }

    const video = response.data.items[0]
    const snippet = video.snippet
    const contentDetails = video.contentDetails

    if (!snippet || !contentDetails) {
      throw new Error('Incomplete video data')
    }

    const durationSeconds = parseDuration(contentDetails.duration || 'PT0S')

    return {
      id: videoId,
      title: snippet.title || '',
      description: snippet.description || '',
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      channelTitle: snippet.channelTitle || '',
      publishedAt: snippet.publishedAt || '',
      duration: durationSeconds,
      tags: snippet.tags || [],
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error)
    throw error
  }
}
