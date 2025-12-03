# Professor Carl - Deployment Guide

## Production Deployment to Vercel

### Quick Start

**Option 1: Deploy via Vercel Dashboard (Recommended for First Deploy)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository (GitHub/GitLab/Bitbucket)
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Add environment variables (see below)
5. Click "Deploy"

**Option 2: Deploy via CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
cd /Users/brandon/ProfeesorCarl
vercel

# Deploy to production
vercel --prod
```

---

## Production URL
**To be assigned after first deployment**

Example: `https://professor-carl.vercel.app`

---

## Deployment Information
- **Platform**: Vercel
- **Framework**: Next.js 16.0.6
- **Region**: US East (iad1)
- **Build Time**: ~2-3 minutes
- **Status**: Ready for deployment

---

## Environment Variables Required

### Critical: Set These Before Deploying

#### Database (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### AI (Anthropic Claude)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

#### Video Analysis (YouTube)
```bash
YOUTUBE_API_KEY=AIzaSy...
```

#### Authentication (Canvas LMS)
```bash
CANVAS_CLIENT_ID=your-canvas-client-id
CANVAS_CLIENT_SECRET=your-canvas-client-secret
CANVAS_PLATFORM_URL=https://canvas.instructure.com
```

#### Application Settings
```bash
NEXT_PUBLIC_APP_URL=https://professor-carl.vercel.app
JWT_SECRET=generate-with-openssl-rand-base64-32
```

### How to Add Environment Variables in Vercel Dashboard

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: Variable name (e.g., `ANTHROPIC_API_KEY`)
   - **Value**: Your secret value
   - **Environment**: Select `Production`, `Preview`, `Development` as needed
4. Click **Save**

### How to Add via CLI

```bash
# After vercel login
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

vercel env add ANTHROPIC_API_KEY production
# Paste value when prompted

# Repeat for all variables...
```

---

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project: **"professor-carl"**
3. Copy your project URL and keys from Project Settings → API
4. Run the schema:
   ```bash
   # Copy schema from /Users/brandon/ProfeesorCarl/supabase/schema.sql
   # Run in Supabase SQL Editor
   ```

### 2. Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create account
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-`)

### 3. Enable YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials → **API Key**
5. Restrict key to YouTube Data API v3
6. Copy API key

### 4. Configure Canvas LMS

1. In your Canvas instance, go to **Developer Keys**
2. Create new LTI key for Professor Carl
3. Configure OAuth:
   - **Redirect URI**: `https://professor-carl.vercel.app/api/auth/lti/callback`
   - **Scopes**: Required LTI scopes
4. Copy Client ID and Client Secret

### 5. Generate JWT Secret

```bash
# Generate secure random secret
openssl rand -base64 32
```

Copy the output and use it for `JWT_SECRET`.

---

## Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Anthropic API key obtained
- [ ] YouTube API enabled and key created
- [ ] Canvas LMS OAuth configured
- [ ] JWT secret generated
- [ ] All environment variables added to Vercel
- [ ] vercel.json configuration file present
- [ ] .vercelignore file present
- [ ] Git repository pushed to GitHub/GitLab
- [ ] Project imported to Vercel
- [ ] First deployment successful
- [ ] Homepage loads correctly
- [ ] Dashboard redirects work
- [ ] API endpoints return proper responses

---

## Monitoring & Maintenance

### Vercel Dashboard

Access your deployment status at:
- **Main Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Project**: `professor-carl`
- **Deployments**: View all deployments and logs
- **Analytics**: Monitor traffic and performance

### View Deployment Logs

```bash
# Via CLI
vercel logs [deployment-url]

# Tail logs in real-time
vercel logs [deployment-url] --follow
```

### Check Build Status

In Vercel Dashboard:
1. Go to your project
2. Click **Deployments**
3. Click any deployment to see:
   - Build logs
   - Runtime logs
   - Error details
   - Performance metrics

---

## Rollback Procedure

If a deployment has issues:

**Via Dashboard:**
1. Go to Deployments
2. Find previous working deployment
3. Click **⋯** menu → **Promote to Production**

**Via CLI:**
```bash
vercel rollback [previous-deployment-id]
```

---

## Custom Domain Setup

### Add Custom Domain

**Via Dashboard:**
1. Project Settings → **Domains**
2. Click **Add Domain**
3. Enter domain (e.g., `professorcarl.com`)
4. Follow DNS configuration instructions

**Via CLI:**
```bash
vercel domains add professorcarl.com
```

### Configure DNS

Add these records in your domain provider:

**For root domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Or use CNAME for root (if supported):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

---

## Troubleshooting

### Build Fails

1. Check build logs in Vercel Dashboard
2. Verify all dependencies in package.json
3. Ensure environment variables are set correctly
4. Check for TypeScript errors

### Environment Variables Not Working

1. Verify variables are set for correct environment (Production/Preview/Development)
2. Re-deploy after adding new variables
3. Check variable names match exactly (case-sensitive)
4. For `NEXT_PUBLIC_*` vars, ensure they start with `NEXT_PUBLIC_`

### API Routes Return 500 Errors

1. Check runtime logs in Vercel Dashboard
2. Verify database connection (Supabase URL and keys)
3. Check API key validity (Anthropic, YouTube)
4. Review error details in function logs

### Slow Performance

1. Enable Vercel Edge Network
2. Configure caching headers
3. Optimize images with Next.js Image component
4. Review bundle size in build output

---

## Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel's encrypted environment variables
- ✅ Rotate API keys regularly
- ✅ Use separate keys for production and development

### Headers
Security headers are configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Database
- ✅ Use Supabase Row Level Security (RLS)
- ✅ Never expose service role key in client code
- ✅ Use anon key for client-side operations

---

## Performance Optimization

### Image Optimization
- Use Next.js Image component
- Serve WebP format
- Implement lazy loading

### Code Splitting
- Automatic with Next.js
- Dynamic imports for large components
- Route-based code splitting

### Caching
- Static pages cached automatically
- API routes cached via headers
- Edge caching enabled

### Bundle Size
Current build output:
```
Route (app)              Size
┌ ○ /                    ~15KB
├ ○ /chat                ~20KB
├ ○ /dashboard           ~25KB
└ ƒ /api/*               Dynamic
```

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Anthropic API**: [docs.anthropic.com](https://docs.anthropic.com)

---

## Deployment Timeline

Typical deployment flow:
1. **Push to Git**: Instant
2. **Vercel detects changes**: ~5 seconds
3. **Build starts**: ~10 seconds
4. **Dependencies install**: ~30-60 seconds
5. **Next.js build**: ~1-2 minutes
6. **Deploy to edge**: ~10-20 seconds
7. **Total**: ~2-3 minutes

---

## Post-Deployment Testing

### Smoke Tests

Test these URLs after deployment:

```bash
# Homepage
curl -I https://professor-carl.vercel.app

# Dashboard (should redirect to onboarding if not authenticated)
curl -I https://professor-carl.vercel.app/dashboard

# API health check
curl https://professor-carl.vercel.app/api/auth/session

# Static assets
curl -I https://professor-carl.vercel.app/_next/static/...
```

### Manual Testing Checklist

- [ ] Homepage loads with liquid glass design
- [ ] Onboarding flow completes
- [ ] Canvas LMS integration works
- [ ] Video analysis functions
- [ ] Chat interface responds
- [ ] Dashboard displays correctly
- [ ] Memory system stores conversations
- [ ] Mobile responsive design works
- [ ] All animations render smoothly

---

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when:
- You push to `main` branch → Production
- You push to any branch → Preview deployment
- You open a Pull Request → Preview deployment with comment

### Preview Deployments

Every branch and PR gets unique preview URL:
- Test changes before production
- Share with team for review
- No impact on production

### Production Deployments

Only `main` branch deploys to production:
```bash
git push origin main
# Vercel auto-deploys to professor-carl.vercel.app
```

---

## Cost Estimation

### Vercel Pricing (Hobby Tier - Free)

**Included:**
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function executions
- Automatic HTTPS
- Edge Network
- Analytics

**Limits:**
- 1 concurrent build
- 6,000 build minutes/month
- 100GB bandwidth/month

**Pro Tier ($20/month):**
- Team collaboration
- 1TB bandwidth/month
- Advanced analytics
- Priority support

### External Services

**Supabase (Free Tier):**
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth

**Anthropic API:**
- Pay per token
- ~$0.003 per 1K input tokens (Claude 3.5)
- ~$0.015 per 1K output tokens

**YouTube Data API:**
- Free
- 10,000 units/day quota

---

## Maintenance Schedule

### Weekly
- Review error logs
- Monitor performance metrics
- Check bandwidth usage

### Monthly
- Update dependencies
- Review security advisories
- Rotate API keys (if needed)
- Check cost vs. budget

### Quarterly
- Performance audit
- Security audit
- Database optimization
- Review user feedback

---

## Emergency Contacts

**Vercel Support:**
- Dashboard: [vercel.com/support](https://vercel.com/support)
- Twitter: [@vercel](https://twitter.com/vercel)
- Email: support@vercel.com

**Service Status:**
- [vercel-status.com](https://vercel-status.com)
- [status.supabase.com](https://status.supabase.com)
- [status.anthropic.com](https://status.anthropic.com)

---

**Last Updated**: December 2, 2025
**Deployment Status**: Ready for production deployment
