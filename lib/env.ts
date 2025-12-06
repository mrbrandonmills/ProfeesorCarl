/**
 * Environment variable validation
 * Ensures all required env vars are present and provides helpful error messages
 */

interface EnvVars {
  // Database
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // Claude AI
  ANTHROPIC_API_KEY: string

  // YouTube
  YOUTUBE_API_KEY: string

  // Canvas LMS
  CANVAS_CLIENT_ID: string
  CANVAS_CLIENT_SECRET: string
  CANVAS_PLATFORM_URL: string

  // App
  NEXT_PUBLIC_APP_URL: string
  JWT_SECRET: string
}

// Canvas credentials are optional since Canvas integration requires admin access
const REQUIRED_ENV_VARS: Array<keyof EnvVars> = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'YOUTUBE_API_KEY',
  'NEXT_PUBLIC_APP_URL',
  'JWT_SECRET',
]

const ENV_VAR_DESCRIPTIONS: Record<keyof EnvVars, string> = {
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL (e.g., https://xxxxx.supabase.co)',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous/public key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (server-side only)',
  ANTHROPIC_API_KEY: 'Anthropic API key for Claude (get from https://console.anthropic.com)',
  YOUTUBE_API_KEY: 'YouTube Data API v3 key (get from Google Cloud Console)',
  CANVAS_CLIENT_ID: 'Canvas LMS OAuth client ID',
  CANVAS_CLIENT_SECRET: 'Canvas LMS OAuth client secret',
  CANVAS_PLATFORM_URL: 'Canvas LMS platform URL (e.g., https://canvas.instructure.com)',
  NEXT_PUBLIC_APP_URL: 'Public URL of this application (e.g., http://localhost:3000)',
  JWT_SECRET: 'Random secret for JWT signing (generate with: openssl rand -base64 32)',
}

export interface ValidationResult {
  isValid: boolean
  missingVars: Array<{
    name: string
    description: string
  }>
  errors: string[]
}

/**
 * Validates that all required environment variables are present
 * Returns detailed results including missing vars and helpful setup instructions
 */
export function validateEnv(): ValidationResult {
  const missingVars: ValidationResult['missingVars'] = []
  const errors: string[] = []

  // Check each required variable
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName]

    if (!value || value.trim() === '') {
      missingVars.push({
        name: varName,
        description: ENV_VAR_DESCRIPTIONS[varName],
      })
    }
  }

  // Generate error messages
  if (missingVars.length > 0) {
    errors.push('❌ Missing required environment variables:')
    errors.push('')

    missingVars.forEach((v) => {
      errors.push(`  ${v.name}`)
      errors.push(`    → ${v.description}`)
      errors.push('')
    })

    errors.push('📝 Setup Instructions:')
    errors.push('')
    errors.push('1. Copy .env.local.example to .env.local (if not done)')
    errors.push('2. Fill in all required values in .env.local')
    errors.push('3. Restart the dev server')
    errors.push('')
    errors.push('📚 See README.md for detailed setup guide')
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    errors,
  }
}

/**
 * Validates env vars and throws error if invalid
 * Use this in API routes to ensure they can't run without proper config
 */
export function requireValidEnv(): void {
  const result = validateEnv()

  if (!result.isValid) {
    throw new Error(
      'Environment validation failed:\n\n' + result.errors.join('\n')
    )
  }
}

/**
 * Gets a validated env var or throws if missing
 */
export function getEnvVar(name: keyof EnvVars): string {
  const value = process.env[name]

  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Description: ${ENV_VAR_DESCRIPTIONS[name]}`
    )
  }

  return value
}
