# Professor Carl 🎓

**A Socratic English tutor powered by Claude and Model Context Protocol (MCP)**

Professor Carl is an AI teaching assistant designed for classroom office hours. Unlike traditional AI that gives direct answers, Carl uses the **Socratic method** to guide students toward understanding through thoughtful questions and tiered hints.

---

## ✨ Features

**Phase 1 (Current) - Working MVP:**
- ✅ **Socratic Pedagogy** - Enforces "guide, don't give" teaching
- ✅ **Programmatic Guardrails** - No spoilers before student attempts
- ✅ **Clean Chat Interface** - Simple, student-friendly UI
- ✅ **MCP Integration** - Ready for course materials access
- ✅ **Academic Integrity** - Built-in protections against misuse
- ✅ **Rate Limiting** - Protection against spam and API cost overruns
- ✅ **Test Suite** - 22 passing tests validating pedagogy

**Phase 2 (Planned):**
- 🚧 Hint stepper UI with tiered reveals
- 🚧 Sub-agents for specific tasks (/thesis, /outline, /cite, /revise)
- 🚧 Tools sidebar showing MCP resources
- 🚧 Additional MCP servers (SQLite, custom)

**Phase 3 (Future):**
- 📋 Student session management
- 📋 Classroom analytics dashboard
- 📋 HTTP MCP servers (when available)
- 📋 Advanced testing with Playwright

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/mrbrandonmills/ProfessorCarl.git
cd ProfessorCarl

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Visit http://localhost:3000 and start chatting with Professor Carl!

---

## 🎯 How It Works

### The Socratic Method in Action

**Traditional AI:**
> Student: "What should my thesis be?"
> AI: "Your thesis should be: In The Great Gatsby, F. Scott Fitzgerald uses..."

**Professor Carl:**
> Student: "What should my thesis be?"
> Carl: "Let's think about this together. What's the main argument you want to make about the text? What would someone disagree with?"

### Pedagogical Rules (Enforced by Middleware)

Carl follows these principles programmatically:

1. **No spoilers before attempts** - Student must try first
2. **Tiered hints** - Conceptual → Structural → Example
3. **Metacognitive checks** - "Why?" and "How do you know?"
4. **Process over product** - Guide drafting, not deliver final work
5. **Academic integrity** - No verbatim graded work

These aren't just guidelines - they're **validated in code** and **tested automatically**.

---

## 📚 For Students

### Good Uses of Professor Carl ✅

- **Brainstorming**: "I'm writing about symbolism. What should I consider?"
- **Getting unstuck**: "I'm stuck on my thesis. Can you help me refine it?"
- **Understanding concepts**: "What's the difference between theme and motif?"
- **Revision help**: "Here's my draft. What could be stronger?"

### Misuse ❌

- Asking Carl to write your essay
- Copying output directly into assignments
- Trying to get answers without attempting
- Using Carl to avoid learning

**Remember**: Carl is a tutor, not a ghostwriter. The work you submit must be your own.

### Rate Limits ⏱️

During testing, Professor Carl has limits to protect against unexpected costs:
- **20 messages per 15 minutes** (per student)
- **200 messages per hour** (everyone combined)

If you hit the limit, Carl will tell you exactly how long to wait before the limit resets. The app isn't broken - it's just protecting the system while we're testing!

See [docs/RATE_LIMITS.md](./docs/RATE_LIMITS.md) for details.

---

## 🛠️ For Instructors

### Deployment

See [docs/DEPLOY.md](./docs/DEPLOY.md) for:
- Local development setup
- Vercel deployment (recommended)
- Docker deployment
- MCP server configuration
- Cost estimates (~$0.05-0.15 per session)

### Safety & Privacy

See [docs/SAFETY.md](./docs/SAFETY.md) for:
- Academic integrity enforcement
- Data privacy (FERPA/GDPR)
- Prompt injection protection
- Content safety
- Incident response

### Customization

**Adjust teaching style** - Edit `/agent/prompts/socratic.md`:
- Change tone (formal/casual)
- Specialize for your subject
- Adjust hint aggressiveness

**Tune pedagogy rules** - Edit `/agent/rubrics/socratic.yml`:
- Minimum student attempts before hints
- Required metacognitive checks
- Forbidden actions

**Add course context** - Update MCP servers in `.mcp.json`:
- Point to your course materials folder
- Add reading lists
- Connect to Notion, Google Drive, etc.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui
```

**Current test coverage:**
- ✅ 22/22 tests passing
- Core Socratic rules validated
- Integration scenarios tested
- Session state management verified

---

## 🏗️ Architecture

```
/app                    # Next.js application
  /api/chat            # Claude API integration + Socratic middleware
  /page.tsx            # Chat UI

/agent                 # Pedagogy configuration
  /prompts             # System prompts (Socratic method)
  /rubrics             # Enforcement rules (YAML)

/server                # Backend logic
  socratic-middleware.ts   # Enforces teaching rules

/docs                  # Documentation
  DEPLOY.md            # Deployment guide
  SAFETY.md            # Safety & privacy guide

/tests                 # Test suite
  socratic.test.ts     # Pedagogy validation tests

.mcp.json             # Model Context Protocol config
```

---

## 🔧 MCP Integration

Professor Carl uses Model Context Protocol to access:
- **Course materials** (filesystem MCP server)
- **Past sessions** (SQLite, optional)
- **External tools** (Notion, GitHub, etc. - coming in Phase 2)

Configure MCP servers in `.mcp.json` to give Carl access to your course resources.

See [docs/DEPLOY.md](./docs/DEPLOY.md) for detailed MCP setup.

---

## 📊 Current Status

### ✅ Phase 1 Complete (MVP)
- Core Socratic engine working
- Chat interface deployed
- Tests passing
- Documentation complete
- Ready for classroom use!

### 🚧 Phase 2 In Progress
- Hint stepper UI
- Sub-agents
- Slash commands

### 📋 Phase 3 Planned
- Analytics
- Advanced MCP
- Classroom management

---

## 💬 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/mrbrandonmills/ProfessorCarl/issues)
- **Questions**: Use GitHub Discussions
- **Contributing**: PRs welcome!

---

## 📄 License

[MIT License](./LICENSE) - Feel free to use in your classroom!

---

## 🙏 Acknowledgments

- **Anthropic** for Claude and MCP
- **Khanmigo** for Socratic pedagogy inspiration
- **Vercel** for Next.js and hosting

---

## 🎓 Philosophy

> "The important thing is not to stop questioning." - Albert Einstein

Professor Carl believes that the best learning happens when students discover answers themselves, guided by thoughtful questions. This tool embodies that philosophy in every interaction.

**Built with ❤️ for educators who believe in teaching students how to think, not what to think.**
# Force fresh deploy
# Model updated to claude-3-5-sonnet-20250620
