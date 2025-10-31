# OpenAI TTS Setup

Professor Carl now uses OpenAI's Text-to-Speech API for high-quality, natural-sounding voice output.

## Environment Variable Required

Add this to your Vercel environment variables:

```
OPENAI_API_KEY=sk-your-key-here
```

**To add it:**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add `OPENAI_API_KEY` with your OpenAI API key
4. Redeploy

## Available Voices

- **alloy** - Neutral, clear (default for Professor Carl)
- **echo** - Male, professional
- **fable** - British accent, expressive
- **onyx** - Deep, authoritative
- **nova** - Warm, engaging
- **shimmer** - Friendly, conversational

## Cost

- **Model:** `tts-1` (standard quality, faster)
- **Pricing:** $15 per 1 million characters
- **Average response:** ~500 characters = $0.0075 per response
- **Expected monthly cost:** $5-20 depending on usage

## Fallback

If OpenAI API fails or key is missing, the system automatically falls back to browser TTS (free but lower quality).

## How It Works

1. User enables voice mode
2. Carl responds with text
3. Text is sent to `/api/tts` endpoint
4. OpenAI generates high-quality audio
5. Audio is streamed to user
6. Cached in browser for 1 year (reduces costs for repeated phrases)

## Testing

To test different voices:
1. Turn on voice mode
2. Click the voice selector (⚙️ icon)
3. Choose from 6 premium voices
4. All sound like ChatGPT - natural, engaging, professional
