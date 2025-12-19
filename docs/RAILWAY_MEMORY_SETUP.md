# Memory System Setup Guide - Railway PostgreSQL

Quick setup for implementing the Professor Carl memory system on Railway.

## 1. Enable pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 2. Create Schema

Copy `supabase/migrations/001_multi_tenant.sql` to your Railway PostgreSQL.

## 3. Environment Variables

```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 4. Key Files to Copy

- `/lib/db/postgres.ts` - Database client with vector search
- `/lib/ai/embeddings.ts` - OpenAI embedding generator
- `/app/api/memory/context/route.ts` - Context builder API
- `/app/api/memory/route.ts` - Save memory API

## 5. Multi-Tenant Queries

All queries filter by user_id:
```sql
SELECT * FROM user_memories WHERE user_id = $1 AND is_current = true
```

## Scaling

| Plan | Users | Cost |
|------|-------|------|
| Hobby | ~500 | $5/mo |
| Pro | ~2000 | $20/mo |
