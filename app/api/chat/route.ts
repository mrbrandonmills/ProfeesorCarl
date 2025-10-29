import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { socraticMiddleware } from '@/server/socratic-middleware';
import rateLimiter from '@/server/rate-limiter';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Get client IP address from request headers
 */
function getClientIP(req: NextRequest): string {
  // Try various headers (Vercel, CloudFlare, standard proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, use the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default (shouldn't happen on Vercel)
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - FIRST line of defense against spam/abuse
    const clientIP = getClientIP(req);
    const rateLimit = rateLimiter.checkLimit(clientIP);

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimit.reason,
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Reset': String(rateLimit.retryAfter || 60),
          },
        }
      );
    }

    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Use sessionId or generate one
    const currentSessionId = sessionId || `session-${Date.now()}`;

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === 'user') {
      socraticMiddleware.processStudentMessage(
        currentSessionId,
        lastUserMessage.content
      );
    }

    // Get system prompt with session context
    const systemPrompt = socraticMiddleware.getSystemPrompt(currentSessionId);

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system: systemPrompt,
      messages: (messages as Message[]).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Extract the assistant's response
    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Validate the response against Socratic rubric
    const validation = socraticMiddleware.validateResponse(
      currentSessionId,
      assistantMessage
    );

    // If blocked, return error with reason
    if (validation.blocked) {
      console.warn('Response blocked:', validation.reason);
      return NextResponse.json(
        {
          error: 'Response validation failed',
          reason: validation.reason,
          fallback:
            "Let me rephrase that - what's your understanding of this topic so far?",
        },
        { status: 422 }
      );
    }

    // Return response with warnings if any
    return NextResponse.json({
      message: assistantMessage,
      sessionId: currentSessionId,
      warnings: validation.warnings,
      sessionState: socraticMiddleware.getSessionSummary(currentSessionId),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Professor Carl API',
    timestamp: new Date().toISOString(),
  });
}
