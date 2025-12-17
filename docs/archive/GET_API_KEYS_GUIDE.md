# 🔑 GET YOUR API KEYS - STEP BY STEP

Follow these instructions **in order**. Copy each key as you get it, then paste them all to Claude at the end.

---

## 1️⃣ SUPABASE KEYS (5 minutes)

### Step 1: Create Supabase Project
1. Go to: **https://supabase.com**
2. Click **"Start your project"** (sign up with GitHub if needed)
3. Click **"New Project"**
4. Fill in:
   - **Name:** `professor-carl`
   - **Database Password:** (create a strong password - save it!)
   - **Region:** Choose closest to you (e.g., `US East`)
5. Click **"Create new project"**
6. ⏰ **Wait 2 minutes** - project is provisioning (get coffee!)

### Step 2: Get Your Supabase Keys
1. Once project is ready, click **Settings** (gear icon on left sidebar)
2. Click **"API"** in the settings menu
3. **You'll see 3 things to copy:**

#### Copy These Values:
```
PROJECT URL:
[Copy from "Project URL" - looks like: https://xxxxx.supabase.co]

ANON PUBLIC KEY:
[Copy from "anon public" - starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...]

SERVICE ROLE KEY:
[Click "Reveal" next to "service_role", then copy - starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...]
```

⚠️ **IMPORTANT:** Keep the Service Role Key SECRET - don't share publicly!

### Step 3: Setup Database
1. Click **"SQL Editor"** on left sidebar
2. Click **"New query"**
3. Open this file on your computer: `/Users/brandon/ProfeesorCarl/supabase/schema.sql`
4. Copy ALL the SQL content
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Cmd+Enter)
7. ✅ You should see: "Success. No rows returned"

---

## 2️⃣ YOUTUBE API KEY (7 minutes)

### Step 1: Create Google Cloud Project
1. Go to: **https://console.cloud.google.com**
2. Sign in with your Google account
3. Click **"Select a project"** dropdown at the top
4. Click **"NEW PROJECT"**
5. Fill in:
   - **Project name:** `Professor Carl`
   - **Location:** Keep default or choose your organization
6. Click **"CREATE"**
7. ⏰ Wait 30 seconds for project creation

### Step 2: Enable YouTube Data API
1. Make sure your new project is selected (check top dropdown)
2. Click **☰ Menu** → **"APIs & Services"** → **"Library"**
3. In the search box, type: `YouTube Data API v3`
4. Click **"YouTube Data API v3"** from results
5. Click **"ENABLE"** button
6. ⏰ Wait 10 seconds

### Step 3: Create API Key
1. Click **☰ Menu** → **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. 🎉 Your API key appears! **Copy it now**

#### Copy This Value:
```
YOUTUBE API KEY:
[Copy the key - starts with: AIzaSy...]
```

### Step 4: Restrict Your API Key (IMPORTANT for security)
1. Click **"EDIT API KEY"** (or click the pencil icon next to your key)
2. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check **"YouTube Data API v3"**
3. Under **"Application restrictions"** (optional but recommended):
   - Select **"HTTP referrers (web sites)"**
   - Click **"ADD AN ITEM"**
   - Add: `*.vercel.app/*`
   - Click **"ADD AN ITEM"** again
   - Add: `localhost/*`
4. Click **"SAVE"**

---

## 3️⃣ CANVAS LMS CREDENTIALS (10 minutes)

### ⚠️ Prerequisites
- You need **Admin access** to your Canvas LMS instance
- If you don't have Canvas yet, **SKIP THIS** - you can add it later

### Step 1: Login as Canvas Admin
1. Go to your Canvas URL (e.g., `https://yourschool.instructure.com`)
2. Login with admin credentials
3. Click **"Admin"** in the left sidebar
4. Select your account/institution

### Step 2: Create Developer Key
1. Click **"Developer Keys"** in the account menu
2. Click **"+ Developer Key"** button
3. Select **"+ LTI Key"**

### Step 3: Configure LTI Key
Fill in these fields:

**Key Name:** `Professor Carl`

**Owner Email:** [Your email]

**Redirect URIs:**
```
https://profeesor-carl-5tiaep3ox-brandons-projects-c4dfa14a.vercel.app/api/auth/lti
http://localhost:3000/api/auth/lti
```

**Method:** `POST`

**Target Link URI:**
```
https://profeesor-carl-5tiaep3ox-brandons-projects-c4dfa14a.vercel.app
```

**OpenID Connect Initiation URL:**
```
https://profeesor-carl-5tiaep3ox-brandons-projects-c4dfa14a.vercel.app/api/auth/lti
```

**JWK Method:** Select **"Public JWK URL"**

**Public JWK URL:**
```
https://profeesor-carl-5tiaep3ox-brandons-projects-c4dfa14a.vercel.app/.well-known/jwks.json
```

**LTI Advantage Services:** Enable these:
- ✅ Can create and view assignment data in the gradebook
- ✅ Can view assignment data in the gradebook
- ✅ Can retrieve user data associated with the context
- ✅ Can lookup Account information

**Placements:** Enable:
- ✅ Course Navigation
- ✅ Assignment Selection

Click **"Save"**

### Step 4: Get Client ID and Secret
1. After saving, find your new key in the list
2. Click **"Show Key"**
3. **Copy these values:**

```
CANVAS CLIENT ID:
[Copy the numeric Client ID - looks like: 10000000000123]

CANVAS CLIENT SECRET:
[Click "Show Secret" and copy - long random string]

CANVAS PLATFORM URL:
[Your Canvas URL, e.g.: https://yourschool.instructure.com]
```

⚠️ **IMPORTANT:** Keep Client Secret PRIVATE!

---

## 📋 YOUR KEYS CHECKLIST

Once you have all keys, copy this template and fill it in:

```
SUPABASE:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

YOUTUBE:
YOUTUBE_API_KEY=AIzaSy...

CANVAS (or type "SKIP CANVAS" if you don't have it yet):
CANVAS_CLIENT_ID=10000000000123
CANVAS_CLIENT_SECRET=xxxxxxxxxxxxx
CANVAS_PLATFORM_URL=https://yourschool.instructure.com
```

---

## 🚀 WHAT TO DO NEXT

1. Follow the steps above to get each key
2. Fill in the template with your real keys
3. **Paste the filled template to me** (Claude)
4. I'll automatically add them to Vercel
5. I'll redeploy your app
6. ✅ Professor Carl will be LIVE!

---

## ⏱️ Time Estimate

- Supabase: 5 minutes
- YouTube: 7 minutes
- Canvas: 10 minutes (or skip for now)
- **Total: 12-22 minutes**

---

## 🆘 STUCK? Quick Fixes

**Supabase won't let me create project:**
- Make sure you're signed up (free tier is fine)
- Check email for verification link

**Can't find YouTube Data API:**
- Make sure you selected your new project at the top
- Search exact text: "YouTube Data API v3"

**Don't have Canvas admin access:**
- Type "SKIP CANVAS" when you send me the keys
- You can add Canvas credentials later
- App will work without Canvas (just no LMS integration)

**Lost a key:**
- Supabase: Go to Settings → API (keys don't change)
- YouTube: Create a new one in Google Cloud Console
- Canvas: Delete old key and create new one

---

## 🎓 READY?

Start with Supabase (easiest), then YouTube, then Canvas (or skip Canvas).

When you have your keys, paste the filled template to me and I'll configure everything!
