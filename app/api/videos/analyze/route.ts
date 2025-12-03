import { NextRequest, NextResponse } from 'next/server';

// Extract YouTube video ID from URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Mock video analysis - In production, this would use YouTube API + Claude
function mockVideoAnalysis(videoId: string) {
  // Mock data for demonstration
  const mockTitles = [
    'Introduction to Kant\'s Categorical Imperative',
    'Understanding Nietzsche\'s Will to Power',
    'Plato\'s Cave Allegory Explained',
    'Descartes and the Method of Doubt',
    'Aristotle\'s Virtue Ethics',
  ];

  const mockTopics = [
    ['ethics', 'moral philosophy', 'categorical imperative'],
    ['existentialism', 'nihilism', 'power'],
    ['epistemology', 'metaphysics', 'forms'],
    ['skepticism', 'rationalism', 'mind-body problem'],
    ['virtue ethics', 'eudaimonia', 'golden mean'],
  ];

  const mockConcepts = [
    ['duty', 'universalizability', 'autonomy', 'reason'],
    ['übermensch', 'eternal recurrence', 'perspectivism'],
    ['forms', 'shadows', 'reality vs appearance'],
    ['cogito ergo sum', 'methodical doubt', 'clear and distinct ideas'],
    ['virtue', 'practical wisdom', 'character'],
  ];

  const difficulties: ('intro' | 'intermediate' | 'advanced')[] = [
    'intro',
    'intermediate',
    'advanced',
  ];

  // Pseudo-random selection based on videoId
  const hash = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % mockTitles.length;

  return {
    video_id: videoId,
    title: mockTitles[index],
    duration: 600 + (hash % 900), // 10-25 minutes
    topics: mockTopics[index],
    difficulty_level: difficulties[hash % difficulties.length],
    key_concepts: mockConcepts[index],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtube_url } = body;

    if (!youtube_url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Mock analysis (in production, use YouTube API + Claude)
    const analysis = mockVideoAnalysis(videoId);

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('Video analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze video' },
      { status: 500 }
    );
  }
}
