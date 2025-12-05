import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET - Retrieve user preferences
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch preferences from database
    const { data, error } = await supabaseAdmin
      .from('learning_preferences')
      .select('*')
      .eq('user_id', payload.userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    // Return preferences or null if not found
    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error('Preferences GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// POST - Create or update user preferences
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { content_preference, interaction_mode, selected_voice } = await request.json()

    // Validate required fields
    if (!content_preference || !interaction_mode || !selected_voice) {
      return NextResponse.json(
        { error: 'All preference fields are required' },
        { status: 400 }
      )
    }

    // Check if preferences already exist
    const { data: existing } = await supabaseAdmin
      .from('learning_preferences')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabaseAdmin
        .from('learning_preferences')
        .update({
          content_preference,
          interaction_mode,
          selected_voice,
        })
        .eq('user_id', payload.userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating preferences:', error)
        return NextResponse.json(
          { error: 'Failed to update preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json({ preferences: data })
    } else {
      // Create new preferences
      const { data, error } = await supabaseAdmin
        .from('learning_preferences')
        .insert({
          user_id: payload.userId,
          content_preference,
          interaction_mode,
          selected_voice,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating preferences:', error)
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json({ preferences: data })
    }
  } catch (error) {
    console.error('Preferences POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}
