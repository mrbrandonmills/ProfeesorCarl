# Professor Carl - Deployment Guide

This guide will help you deploy Professor Carl for your classroom.

## Quick Start (5 minutes)

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key ([get one here](https://console.anthropic.com/))
- Git (for cloning)

### Local Development

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/ProfessorCarl.git
   cd ProfessorCarl
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to http://localhost:3000
   - Start chatting with Professor Carl!

## Production Deployment

### Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps and has excellent MCP support.

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add environment variables**
   - Go to your project settings on Vercel
   - Add `ANTHROPIC_API_KEY` under "Environment Variables"

4. **Done!** Your app is live

**One-click deploy:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ProfessorCarl)

### Other Deployment Options

#### Docker
```bash
# Build image
docker build -t professor-carl .

# Run container
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=your_key professor-carl
```

#### Traditional Node Server
```bash
npm run build
npm run start
```

## MCP Server Setup

Professor Carl uses Model Context Protocol (MCP) to connect to tools and context sources like course materials, documents, and databases.

### Phase 1: Filesystem MCP (Course Materials)

This allows Carl to read course materials, syllabi, and reading documents.

1. **Organize your course materials**
   ```
   /course-materials/
     /syllabus/
     /readings/
     /assignments/
     /resources/
   ```

2. **Update .mcp.json**
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-filesystem", "/full/path/to/course-materials"],
         "transport": "stdio",
         "enabled": true
       }
     }
   }
   ```

3. **Set environment variable**
   ```bash
   echo "MCP_FILESYSTEM_ROOT=/full/path/to/course-materials" >> .env
   ```

4. **Test access**
   ```bash
   npm run dev
   # Carl can now reference your course materials!
   ```

### Future MCP Servers (Phase 2+)

As the MCP ecosystem matures, you can add more servers:

#### SQLite (Session History)
```json
{
  "sqlite": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/sessions.db"],
    "transport": "stdio",
    "enabled": true
  }
}
```

#### Custom MCP Servers (HTTP Transport)
When HTTP-based MCP servers become available:

```json
{
  "notion": {
    "transport": "http",
    "url": "https://mcp.notion.com/mcp",
    "authentication": {
      "type": "bearer",
      "token": "${NOTION_API_KEY}"
    }
  }
}
```

### MCP Authentication

For MCP servers that require auth:

1. **Add credentials to .env**
   ```bash
   NOTION_API_KEY=secret_xxxxx
   GITHUB_TOKEN=ghp_xxxxx
   ```

2. **Reference in .mcp.json**
   ```json
   {
     "authentication": {
       "token": "${NOTION_API_KEY}"
     }
   }
   ```

3. **Scope configuration**
   - `project`: Team-wide (checked into git, paths relative)
   - `user`: Personal servers only
   - `local`: Machine-specific

## Customizing Professor Carl

### Adjusting Teaching Style

Edit `/agent/prompts/socratic.md` to customize:
- Tone and formality
- Subject specialization (currently English, but adaptable)
- Hint aggressiveness
- Session flow

### Adjusting Pedagogy Rules

Edit `/agent/rubrics/socratic.yml` to tune:
- Minimum student attempts before hints
- Required number of metacognitive checks
- Hint tier requirements
- Forbidden actions

### Adding Course-Specific Context

Create a custom system prompt addition:

```typescript
// In server/socratic-middleware.ts
const courseContext = `
## Course Context

This is English 101, Fall 2024.
Required texts: [list]
Current unit: Rhetorical Analysis
Key concepts: Ethos, Pathos, Logos
`;

// Append to system prompt
```

## Performance & Cost

### API Usage

Professor Carl uses Claude 3.5 Sonnet. Typical costs:

- **Average session**: 5-10 messages
- **Average tokens per message**: ~1000 tokens
- **Cost per session**: ~$0.05-0.15
- **Monthly cost (100 students, 2 sessions/week)**: ~$40-120

### Rate Limiting

Add rate limiting in production:

```typescript
// app/api/chat/route.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // 20 requests per window
});
```

### Caching

Consider caching common questions:

```typescript
// Future feature: Response caching for FAQs
```

## Monitoring

### Basic Logging

Check logs for:
- Socratic rule violations (warnings in console)
- Blocked responses (422 status codes)
- API errors

### Advanced Monitoring (Phase 3)

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

## Troubleshooting

### "API key not found"
- Check `.env` file exists and has `ANTHROPIC_API_KEY`
- Restart dev server after adding env vars

### "MCP server not responding"
- Verify paths in `.mcp.json` are absolute
- Check MCP server is installed: `npx @modelcontextprotocol/server-filesystem --version`

### "Response blocked by Socratic rules"
- This is working as intended! Carl won't give direct answers
- Check `/docs/SAFETY.md` for pedagogy details

### "Slow response times"
- Claude API can take 2-5 seconds for responses
- Consider streaming (Phase 2 feature)
- Check network connection

## Security Checklist

Before deploying to students:

- [ ] Environment variables secured (not in git)
- [ ] Rate limiting enabled
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Student data privacy configured (see SAFETY.md)
- [ ] Course materials access restricted
- [ ] API key rotated regularly

## Scaling for Classrooms

### Single Class (< 50 students)
- Free tier Vercel hosting works fine
- No database needed
- Sessions are stateless

### Multiple Classes (50-200 students)
- Consider paid Vercel plan for better limits
- Add SQLite for session persistence
- Enable caching

### Department-Wide (200+ students)
- Dedicated server recommended
- PostgreSQL for session storage
- Load balancing
- Dedicated API key with higher limits

## Support

- **Issues**: https://github.com/yourusername/ProfessorCarl/issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: your-email@university.edu

## Next Steps

Once deployed:

1. Test with sample student scenarios (see `/tests`)
2. Review safety and privacy (see `/docs/SAFETY.md`)
3. Customize for your course (see above)
4. Train students on how to use Carl effectively
5. Collect feedback and iterate

---

**Phase 1 Complete!** You now have a working Socratic tutor.

For Phase 2 features (hint stepper, sub-agents, slash commands), see the project roadmap.
