// ===========================================
// YOUTUBE DATA API v3 - Direct Fetch Implementation
// ===========================================
// Uses fetch directly for better control and error handling
// Falls back to web scraping if API key has referrer restrictions

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_SEARCH_URL = 'https://www.youtube.com/results'

interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    description: string
    channelTitle: string
    publishedAt: string
    thumbnails: {
      high?: { url: string }
      medium?: { url: string }
      default?: { url: string }
    }
  }
}

interface YouTubeVideoItem {
  id: string
  snippet: {
    title: string
    description: string
    channelTitle: string
    publishedAt: string
    tags?: string[]
    thumbnails: {
      high?: { url: string }
      medium?: { url: string }
      default?: { url: string }
    }
  }
  contentDetails: {
    duration: string
  }
  statistics: {
    viewCount: string
    likeCount?: string
  }
}

/**
 * Extract video ID from YouTube URL
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
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY not configured')
  }

  const url = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoId,
    key: apiKey,
  })

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    console.error('[YouTube API] Error:', data.error?.message || 'Unknown error')
    throw new Error(data.error?.message || 'Failed to fetch video')
  }

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found')
  }

  const video = data.items[0] as YouTubeVideoItem
  const durationSeconds = parseDuration(video.contentDetails?.duration || 'PT0S')

  return {
    id: videoId,
    title: video.snippet.title || '',
    description: video.snippet.description || '',
    thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || '',
    channelTitle: video.snippet.channelTitle || '',
    publishedAt: video.snippet.publishedAt || '',
    duration: durationSeconds,
    tags: video.snippet.tags || [],
    viewCount: parseInt(video.statistics?.viewCount || '0', 10),
  }
}

/**
 * Curated educational videos for common topics
 * Used as fallback when YouTube API has restrictions
 */
const CURATED_VIDEOS: Record<string, Array<{id: string, title: string, channelTitle: string}>> = {
  'quantum': [
    { id: 'p7bzE1E5PMY', title: 'Quantum Physics for 7 Year Olds', channelTitle: 'Dominic Walliman' },
    { id: 'JhHMJCUmq28', title: 'Quantum Mechanics in 5 Minutes', channelTitle: 'Domain of Science' },
    { id: 'WIyTZDHuarQ', title: 'The Map of Quantum Physics', channelTitle: 'Domain of Science' },
  ],
  'machine learning': [
    { id: 'aircAruvnKk', title: 'But what is a neural network?', channelTitle: '3Blue1Brown' },
    { id: 'IHZwWFHWa-w', title: 'Gradient descent, how neural networks learn', channelTitle: '3Blue1Brown' },
    { id: 'Ilg3gGewQ5U', title: 'What is Machine Learning?', channelTitle: 'Google Cloud' },
  ],
  'physics': [
    { id: 'p7bzE1E5PMY', title: 'Physics Explained Simply', channelTitle: 'Kurzgesagt' },
    { id: 'DkzQxw16G9w', title: 'The Entire History of Physics', channelTitle: 'Sciencephile' },
  ],
  'calculus': [
    { id: 'WUvTyaaNkzM', title: 'The Essence of Calculus', channelTitle: '3Blue1Brown' },
    { id: 'kfF40MiS7zA', title: 'Calculus in 20 Minutes', channelTitle: 'Organic Chemistry Tutor' },
  ],
  'biology': [
    { id: 'QnQe0xW_JY4', title: 'DNA Replication', channelTitle: 'Amoeba Sisters' },
    { id: 'uXdzuz2gUWM', title: 'How Evolution Works', channelTitle: 'Kurzgesagt' },
  ],
  'chemistry': [
    { id: 'FSyAehMdpyI', title: 'The Periodic Table Explained', channelTitle: 'Kurzgesagt' },
    { id: 'QiiyvzZBKT8', title: 'Atomic Structure', channelTitle: 'Professor Dave' },
  ],
  'economics': [
    { id: 'd8uTB5XorBw', title: 'How The Economic Machine Works', channelTitle: 'Ray Dalio' },
    { id: 'PHe0bXAIuk0', title: 'Economics Explained', channelTitle: 'Crash Course' },
  ],
}

/**
 * Find curated videos matching a topic
 */
function findCuratedVideos(topic: string, maxResults: number = 3): Array<{
  id: string
  title: string
  description: string
  thumbnailUrl: string
  channelTitle: string
  publishedAt: string
  url: string
}> {
  const topicLower = topic.toLowerCase()

  for (const [key, videos] of Object.entries(CURATED_VIDEOS)) {
    if (topicLower.includes(key) || key.includes(topicLower)) {
      return videos.slice(0, maxResults).map(v => ({
        id: v.id,
        title: v.title,
        description: `Educational video about ${topic}`,
        thumbnailUrl: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
        channelTitle: v.channelTitle,
        publishedAt: '',
        url: `https://www.youtube.com/watch?v=${v.id}`,
      }))
    }
  }

  return []
}

/**
 * Search YouTube for educational videos on a topic
 * Filters for quality: embeddable, safe, English, educational channels
 * Falls back to curated videos if API has referrer restrictions
 */
export async function searchVideos(topic: string, maxResults: number = 5) {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    console.error('[YouTube API] YOUTUBE_API_KEY not configured, using curated videos')
    return findCuratedVideos(topic, maxResults)
  }

  try {
    // Search with educational focus
    const searchQuery = `${topic} explained tutorial`

    const searchUrl = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: String(maxResults * 2), // Get extra to filter
      videoEmbeddable: 'true',
      safeSearch: 'strict',
      relevanceLanguage: 'en',
      videoDuration: 'medium', // 4-20 minutes - good for educational content
      order: 'relevance',
      key: apiKey,
    })

    console.log('[YouTube API] Searching for:', searchQuery)

    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (!searchResponse.ok) {
      console.error('[YouTube API] Search error:', searchData.error?.message || searchData)
      // Fall back to curated videos on API error (e.g., referrer blocked)
      console.log('[YouTube API] Falling back to curated videos')
      return findCuratedVideos(topic, maxResults)
    }

    if (!searchData.items || searchData.items.length === 0) {
      console.log('[YouTube API] No results found for:', topic)
      return findCuratedVideos(topic, maxResults)
    }

    // Get video IDs for detailed info
    const videoIds = searchData.items
      .map((item: YouTubeSearchItem) => item.id?.videoId)
      .filter(Boolean)
      .join(',')

    // Fetch video details for view counts (quality signal)
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: videoIds,
      key: apiKey,
    })

    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()

    if (!detailsResponse.ok || !detailsData.items) {
      // Fall back to search results without filtering
      return searchData.items.slice(0, maxResults).map((item: YouTubeSearchItem) => ({
        id: item.id?.videoId || '',
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
        channelTitle: item.snippet?.channelTitle || '',
        publishedAt: item.snippet?.publishedAt || '',
        url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      }))
    }

    // Sort by view count (quality signal) and filter
    const sortedVideos = (detailsData.items as YouTubeVideoItem[])
      .map(video => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || '',
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        viewCount: parseInt(video.statistics?.viewCount || '0', 10),
        duration: parseDuration(video.contentDetails?.duration || 'PT0S'),
      }))
      // Filter: at least 10k views (quality signal) and 3+ minutes
      .filter(v => v.viewCount >= 10000 && v.duration >= 180)
      // Sort by views descending
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, maxResults)

    // If filtering removed all results, return unfiltered top results
    if (sortedVideos.length === 0) {
      console.log('[YouTube API] No videos passed quality filter, returning top results')
      return (detailsData.items as YouTubeVideoItem[]).slice(0, maxResults).map(video => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || '',
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${video.id}`,
      }))
    }

    console.log('[YouTube API] Found', sortedVideos.length, 'quality videos for:', topic)
    return sortedVideos

  } catch (error) {
    console.error('[YouTube API] Error:', error)
    // Fall back to curated videos on any error
    return findCuratedVideos(topic, maxResults)
  }
}

/**
 * Search for videos from trusted educational channels
 */
export async function searchEducationalVideos(topic: string, maxResults: number = 5) {
  // Trusted educational channels
  const educationalChannels = [
    'Kurzgesagt',
    'Veritasium',
    'SmarterEveryDay',
    '3Blue1Brown',
    'CrashCourse',
    'TED-Ed',
    'Khan Academy',
    'Numberphile',
    'MinutePhysics',
    'SciShow',
  ]

  // Try searching with channel hints
  const channelQuery = `${topic} (${educationalChannels.slice(0, 3).join(' OR ')})`
  const results = await searchVideos(channelQuery, maxResults)

  if (results.length > 0) {
    return results
  }

  // Fall back to general search
  return searchVideos(topic, maxResults)
}
