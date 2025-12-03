import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (in production, use Supabase)
let videoLibrary: any[] = [];

export async function GET(request: NextRequest) {
  try {
    // Return all videos in library
    return NextResponse.json({ videos: videoLibrary }, { status: 200 });
  } catch (error) {
    console.error('Error fetching video library:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video library' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      video_id,
      title,
      duration,
      topics,
      difficulty_level,
      key_concepts,
    } = body;

    // Validate required fields
    if (!video_id || !title || !duration || !topics || !difficulty_level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if video already exists
    const existingVideo = videoLibrary.find((v) => v.video_id === video_id);
    if (existingVideo) {
      return NextResponse.json(
        { error: 'Video already exists in library' },
        { status: 409 }
      );
    }

    // Create new video entry
    const newVideo = {
      id: `video_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      video_id,
      title,
      duration,
      topics,
      difficulty_level,
      key_concepts: key_concepts || [],
      view_count: 0,
      helpful_count: 0,
      created_at: new Date().toISOString(),
    };

    // Add to library
    videoLibrary.push(newVideo);

    return NextResponse.json(newVideo, { status: 201 });
  } catch (error) {
    console.error('Error adding video to library:', error);
    return NextResponse.json(
      { error: 'Failed to add video to library' },
      { status: 500 }
    );
  }
}
