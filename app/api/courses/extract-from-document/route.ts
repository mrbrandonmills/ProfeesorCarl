import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Claude AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

// Helper to extract text from PDF
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // For MVP, we'll just return a placeholder
  // In production, use pdf-parse or similar library
  return buffer.toString('utf-8')
}

// Helper to extract text from DOCX
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  // For MVP, we'll just return a placeholder
  // In production, use mammoth or similar library
  return buffer.toString('utf-8')
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('document') as File

    if (!file) {
      return NextResponse.json({ error: 'No document file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload PDF or DOCX' }, { status: 400 })
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text based on file type
    let documentText: string
    if (file.type === 'application/pdf') {
      documentText = await extractTextFromPdf(buffer)
    } else {
      documentText = await extractTextFromDocx(buffer)
    }

    // Use Claude AI to extract course structure
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are an educational curriculum analyzer. Extract the course structure from this document.

Document content:
${documentText.slice(0, 15000)} ${documentText.length > 15000 ? '...(truncated)' : ''}

Extract and return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "courseTitle": "string - the main course title",
  "courseDescription": "string - 1-2 sentence overview of what the course covers",
  "lessons": [
    {
      "title": "string - lesson topic title",
      "objectives": ["string - learning objective 1", "string - learning objective 2"],
      "videoUrl": ""
    }
  ]
}

Guidelines:
- Extract 3-8 main lessons/topics from the document
- Each lesson should have 2-4 specific, measurable learning objectives
- Leave videoUrl as empty string for all lessons
- Be specific and educational in your extraction
- If document structure is unclear, infer logical lesson sequence`
      }]
    })

    // Parse Claude's response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from AI')
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonText = content.text.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim()
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '').trim()
    }

    const extractedData = JSON.parse(jsonText)

    // Validate structure
    if (!extractedData.courseTitle || !extractedData.lessons || !Array.isArray(extractedData.lessons)) {
      throw new Error('Invalid extraction format from AI')
    }

    return NextResponse.json(extractedData)

  } catch (error) {
    console.error('Document extraction error:', error)
    return NextResponse.json(
      {
        error: 'Failed to extract course structure',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}
