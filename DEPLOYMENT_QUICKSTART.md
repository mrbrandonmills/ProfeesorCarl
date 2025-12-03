# Professor Carl - Deployment Quick Start

## 🚀 Deploy to Vercel in 15 Minutes

### Prerequisites Checklist

Before deploying, you need:
- [ ] Supabase account (free tier OK)
- [ ] Anthropic API key
- [ ] Google Cloud account (YouTube API)
- [ ] Canvas LMS access (for OAuth setup)
- [ ] Vercel account (free tier OK)

---

## Option 1: Deploy via Vercel Dashboard (Easiest)

### Step 1: Import Repository (2 min)

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"**
3. Select your **ProfeesorCarl** repository
4. Click **"Import"**

### Step 2: Configure Project (1 min)

Verify these settings:
- **Framework Preset**: Next.js ✅ (auto-detected)
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅

Click **"Continue"** (don't deploy yet!)

### Step 3: Add Environment Variables (10 min)

Click **"Environment Variables"** and add:

```bash
# 1. Supabase (get from supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Anthropic (get from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...

# 3. YouTube (get from console.cloud.google.com)
YOUTUBE_API_KEY=AIzaSyxxxxx...

# 4. Canvas LMS (get from your Canvas instance)
CANVAS_CLIENT_ID=10000000000xxx
CANVAS_CLIENT_SECRET=xxxxx...
CANVAS_PLATFORM_URL=https://canvas.instructure.com

# 5. Application (set after deployment)
NEXT_PUBLIC_APP_URL=https://professor-carl.vercel.app
JWT_SECRET=[generate with: openssl rand -base64 32]
```

**For each variable:**
1. Paste **Name** (e.g., `ANTHROPIC_API_KEY`)
2. Paste **Value** (your actual key)
3. Select **Production** environment
4. Click **"Add"**

### Step 4: Deploy! (2 min)

1. Click **"Deploy"**
2. Wait for build (~2-3 minutes)
3. Get your production URL: `https://professor-carl-xxxxx.vercel.app`

### Step 5: Update App URL (1 min)

1. Copy your production URL
2. Go to **Settings** → **Environment Variables**
3. Edit `NEXT_PUBLIC_APP_URL`
4. Update value to your production URL
5. Click **"Save"**
6. Redeploy: **Deployments** → **⋯** → **"Redeploy"**

---

## Option 2: Deploy via CLI (For Developers)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
# Or if permission denied:
sudo npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
# Follow authentication prompt
```

### Step 3: Deploy

```bash
cd /Users/brandon/ProfeesorCarl
vercel
```

**Answer prompts:**
- Set up and deploy? **Yes**
- Which scope? **[Your account]**
- Link to existing project? **No**
- Project name? **professor-carl**
- Override settings? **No**

### Step 4: Add Environment Variables

```bash
# Add each variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add YOUTUBE_API_KEY production
vercel env add CANVAS_CLIENT_ID production
vercel env add CANVAS_CLIENT_SECRET production
vercel env add CANVAS_PLATFORM_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add JWT_SECRET production
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## Getting Your API Keys

### 1. Supabase (5 min)

1. Go to **[supabase.com](https://supabase.com)**
2. Click **"Start your project"**
3. Create project: **"professor-carl"**
4. Wait for setup (~2 min)
5. Go to **Settings** → **API**
6. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`
7. Go to **SQL Editor**
8. Copy contents of `/Users/brandon/ProfeesorCarl/supabase/schema.sql`
9. Paste and **Run**

### 2. Anthropic API (3 min)

1. Go to **[console.anthropic.com](https://console.anthropic.com)**
2. Sign in (or create account)
3. Click **"API Keys"** in sidebar
4. Click **"Create Key"**
5. Name: "Professor Carl Production"
6. Copy key → `ANTHROPIC_API_KEY`
7. **IMPORTANT**: Save key now (can't view again)

### 3. YouTube API (7 min)

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**
2. Create new project: **"Professor Carl"**
3. Go to **APIs & Services** → **Library**
4. Search: **"YouTube Data API v3"**
5. Click **"Enable"**
6. Go to **Credentials** → **Create Credentials** → **API Key**
7. Click **"Restrict Key"**
8. API restrictions: Select **"YouTube Data API v3"**
9. Click **"Save"**
10. Copy key → `YOUTUBE_API_KEY`

### 4. Canvas LMS OAuth (10 min)

**In your Canvas instance:**

1. Go to **Admin** → **Developer Keys**
2. Click **+ Developer Key** → **+ LTI Key**
3. Configure:
   - **Key Name**: Professor Carl
   - **Redirect URIs**: `https://professor-carl.vercel.app/api/auth/lti/callback`
   - **Method**: Manual Entry
   - **Title**: Professor Carl
   - **Description**: AI Teaching Assistant
4. Click **"Save"**
5. Set state to **"On"**
6. Copy:
   - Client ID → `CANVAS_CLIENT_ID`
   - Show Key → `CANVAS_CLIENT_SECRET`

### 5. JWT Secret (1 min)

```bash
openssl rand -base64 32
```

Copy output → `JWT_SECRET`

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] **Homepage loads**: Visit your production URL
- [ ] **Liquid glass design renders**: Check visual styling
- [ ] **No console errors**: Open browser DevTools
- [ ] **Onboarding flow works**: Click through setup
- [ ] **API endpoints respond**: Check network tab
- [ ] **Mobile responsive**: Test on phone
- [ ] **SSL certificate active**: See 🔒 in browser

---

## Troubleshooting

### Build Failed

**Check:**
```bash
# View logs in Dashboard
Deployments → [Click deployment] → Build Logs
```

**Common fixes:**
- Missing dependencies: `npm install`
- TypeScript errors: Check `npm run build` locally
- Environment variables: Verify all 10 are set

### Environment Variables Not Working

**Fix:**
1. Verify variable names are **exact** (case-sensitive)
2. Ensure set for **Production** environment
3. **Redeploy** after adding/changing variables
4. Check for typos in values

### API Returns 500 Error

**Check:**
1. Runtime logs: **Deployments** → **Functions** → View logs
2. Database connection: Test Supabase URL
3. API key validity: Check Anthropic console
4. CORS settings: Verify `NEXT_PUBLIC_APP_URL` is correct

### Slow Performance

**Optimize:**
1. Enable Vercel Analytics: **Settings** → **Analytics** → Enable
2. Check bundle size: Review build output
3. Implement caching: Add to `vercel.json`
4. Use CDN: Vercel does this automatically

---

## Cost Summary

### Free Tier Limits

**Vercel (Hobby - Free)**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Edge Network

**Supabase (Free)**
- ✅ 500MB database
- ✅ 50,000 monthly active users
- ✅ 2GB bandwidth

**YouTube API (Free)**
- ✅ 10,000 units/day

**Anthropic (Pay-as-you-go)**
- 💰 ~$0.003 per 1K input tokens
- 💰 ~$0.015 per 1K output tokens
- 💰 Estimated: $2-5/month for 100 chats/day

**Total Monthly Cost**: $2-5 (Anthropic API only)

---

## What to Monitor

### Daily
- Error rate (should be < 1%)
- Response time (should be < 2s)
- Uptime (should be 99.9%+)

### Weekly
- User analytics
- API quota usage
- Bandwidth consumption

### Monthly
- Dependency updates
- Security advisories
- Cost vs. budget

---

## Getting Help

**Documentation:**
- Deployment: `DEPLOYMENT.md`
- Monitoring: `MONITORING.md`
- Full Report: `DEPLOYMENT_REPORT.md`

**Support:**
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Anthropic: [docs.anthropic.com](https://docs.anthropic.com)

---

## Next Steps

After successful deployment:

1. **Set up monitoring**
   - Configure uptime monitoring (UptimeRobot)
   - Enable Vercel Analytics
   - Set up error alerts

2. **Custom domain** (optional)
   - Register domain
   - Add to Vercel: **Settings** → **Domains**
   - Configure DNS

3. **Optimize**
   - Review analytics
   - Implement caching
   - Optimize images

4. **Share**
   - Test with real users
   - Gather feedback
   - Iterate and improve

---

**Ready to deploy?** Choose Option 1 (Dashboard) or Option 2 (CLI) above and follow the steps!

**Time to production**: 15-20 minutes 🚀

**Last Updated**: December 2, 2025
