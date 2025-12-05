# Canvas Credentials Setup Guide

**You need TWO separate credential sets from Canvas:**

1. **LTI 1.3 Developer Key** - For user authentication and app launching
2. **Canvas REST API Developer Key** - For reading course content (modules, assignments, pages)

**Important:** These are separate OAuth flows with different purposes. Both are required.

---

## Prerequisites

**You must have:**
- ✅ Admin access to a Canvas instance (your university's Canvas or Canvas Free-for-Teacher account)
- ✅ Access to Developer Keys section (Admin → Developer Keys)

**Don't have admin access?**
- Option A: Request from your IT department/Canvas admin
- Option B: Sign up for Canvas Free-for-Teacher: https://www.instructure.com/canvas/try-canvas

---

## Part 1: LTI 1.3 Developer Key (Authentication)

**Purpose:** Allows students/professors to launch Professor Carl from within Canvas

### Step 1: Access Developer Keys

1. Log in to Canvas as Admin
2. Click **Admin** in left sidebar
3. Click your account name
4. Click **Developer Keys** in left sidebar

### Step 2: Create LTI Key

1. Click **+ Developer Key** button (top right)
2. Select **+ LTI Key**
3. Fill out the form:

**Key Name:**
```
Professor Carl - LTI 1.3
```

**Description:**
```
Socratic learning assistant using AI dialogue
```

**Redirect URIs:** (one per line)
```
https://your-vercel-domain.vercel.app/api/auth/lti/callback
http://localhost:3000/api/auth/lti/callback
```

**Method:** Select "Manual Entry"

**Title:**
```
Professor Carl
```

**Target Link URI:**
```
https://your-vercel-domain.vercel.app/api/auth/lti
```

**OpenID Connect Initiation URL:**
```
https://your-vercel-domain.vercel.app/api/auth/lti
```

**JWK Method:** Select "Public JWK URL"

**Public JWK URL:**
```
https://your-vercel-domain.vercel.app/api/auth/lti/jwks
```

**LTI Advantage Services:**
- ✅ Enable **Can create and view assignment data in the gradebook associated with the tool**
- ✅ Enable **Can view assignment data in the gradebook associated with the tool**
- ✅ Enable **Can view and list group memberships**
- ✅ Enable **Can create and update course content**

**Placements:**
- ✅ Check **Course Navigation**
- ✅ Check **Assignment Selection**

**Domain:** (leave blank for now, or add your domain)

**Tool Configuration:** (leave as Manual Entry)

### Step 3: Save and Get Credentials

4. Click **Save**
5. Canvas will show you the key - **DO NOT CLOSE THIS WINDOW YET**
6. Copy these values:

**Client ID:** (looks like: `170000000000001`)
```
[COPY AND PASTE HERE]
```

**Deployment ID:** (looks like: `1234:abcd1234efgh5678ijkl`)
```
[COPY AND PASTE HERE]
```

7. Click **OK**

### Step 4: Enable the Key

8. Find your new key in the list
9. Toggle the **State** from OFF to **ON**
10. Confirm by clicking **Enable**

### Step 5: Get Canvas URLs

You also need your Canvas instance URLs:

**Canvas Instance URL:** (e.g., `https://canvas.instructure.com` or `https://your-university.instructure.com`)
```
[YOUR CANVAS URL HERE]
```

**JWKS URL:** (replace [CANVAS_URL] with your actual Canvas URL)
```
https://[CANVAS_URL]/api/lti/security/jwks
```

**Access Token URL:**
```
https://[CANVAS_URL]/login/oauth2/token
```

**Authorization URL:**
```
https://[CANVAS_URL]/api/lti/authorize_redirect
```

---

## Part 2: Canvas REST API Developer Key (Course Content)

**Purpose:** Allows Professor Carl to read course modules, assignments, and pages

### Step 1: Create API Key

1. Still in **Developer Keys** section
2. Click **+ Developer Key** button
3. Select **+ API Key** (NOT LTI Key this time)

### Step 2: Fill Out Form

**Key Name:**
```
Professor Carl - REST API
```

**Owner Email:**
```
[Your email address]
```

**Redirect URI:**
```
https://your-vercel-domain.vercel.app/api/canvas/oauth/callback
```

**Redirect URIs:** (one per line)
```
https://your-vercel-domain.vercel.app/api/canvas/oauth/callback
http://localhost:3000/api/canvas/oauth/callback
```

**Icon URL:** (optional - leave blank)

**Notes:**
```
API access for reading course content (modules, assignments, pages)
```

**Test Cluster Only:** Leave unchecked

### Step 3: Save and Get Credentials

4. Click **Save**
5. Canvas will show you the credentials - **DO NOT CLOSE THIS WINDOW YET**
6. Copy these values:

**Client ID:** (looks like: `170000000000002`)
```
[COPY AND PASTE HERE]
```

**Client Secret:** (looks like: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`)
```
[COPY AND PASTE HERE - KEEP THIS SECRET!]
```

7. Click **OK**

### Step 4: Enable the Key

8. Find your new API key in the list
9. Toggle the **State** from OFF to **ON**
10. Confirm by clicking **Enable**

---

## Part 3: YouTube Data API v3 Key

**Purpose:** Fetch video metadata (title, duration, thumbnails) and transcripts

### Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create Project

1. Click **Select a project** dropdown (top bar)
2. Click **NEW PROJECT**
3. Project name: `Professor Carl YouTube API`
4. Click **CREATE**
5. Wait for project creation (few seconds)
6. Select your new project from the dropdown

### Step 3: Enable YouTube Data API v3

1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for: `YouTube Data API v3`
3. Click **YouTube Data API v3**
4. Click **ENABLE**
5. Wait for it to enable (few seconds)

### Step 4: Create API Key

1. In the left sidebar, click **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** (top)
3. Select **API key**
4. Google will create a key and show it - **DO NOT CLOSE THIS WINDOW YET**

**Your API Key:** (looks like: `AIzaSyD1234abcd5678efgh9012ijkl3456mnop`)
```
[COPY AND PASTE HERE]
```

### Step 5: Restrict the Key (Security Best Practice)

5. Click **RESTRICT KEY**
6. **Name:** Change to `Professor Carl - YouTube API`
7. **Application restrictions:** Select **None** (or set to your Vercel IPs if you know them)
8. **API restrictions:** Select **Restrict key**
9. In dropdown, search and select: **YouTube Data API v3**
10. Click **SAVE**

---

## Part 4: Add Credentials to Your Project

Now add all credentials to your `.env.local` file:

### Step 1: Open .env.local

```bash
cd "/Volumes/Super Mastery/ProfeesorCarl/ProfeesorCarl"
open .env.local
```

### Step 2: Add These Lines

Add the following to your `.env.local` file (replace with YOUR actual values):

```bash
# ============================================
# CANVAS LTI 1.3 CREDENTIALS (Authentication)
# ============================================
CANVAS_LTI_CLIENT_ID="170000000000001"
CANVAS_LTI_DEPLOYMENT_ID="1234:abcd1234efgh5678ijkl"
CANVAS_INSTANCE_URL="https://your-institution.instructure.com"

# Canvas LTI endpoints (constructed from instance URL)
CANVAS_JWKS_URL="${CANVAS_INSTANCE_URL}/api/lti/security/jwks"
CANVAS_TOKEN_URL="${CANVAS_INSTANCE_URL}/login/oauth2/token"
CANVAS_AUTH_URL="${CANVAS_INSTANCE_URL}/api/lti/authorize_redirect"

# ============================================
# CANVAS REST API CREDENTIALS (Course Content)
# ============================================
CANVAS_API_CLIENT_ID="170000000000002"
CANVAS_API_CLIENT_SECRET="abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
CANVAS_API_OAUTH_URL="${CANVAS_INSTANCE_URL}/login/oauth2/auth"
CANVAS_API_TOKEN_URL="${CANVAS_INSTANCE_URL}/login/oauth2/token"

# ============================================
# YOUTUBE DATA API v3
# ============================================
YOUTUBE_API_KEY="AIzaSyD1234abcd5678efgh9012ijkl3456mnop"

# ============================================
# JWT SECRET (for Professor Carl auth tokens)
# ============================================
# Generate a random 64-character string
JWT_SECRET="generate_a_random_64_character_string_here_use_openssl_rand_base64_48"
```

### Step 3: Generate JWT Secret

Run this command to generate a secure random JWT secret:

```bash
openssl rand -base64 48
```

Copy the output and paste it as your `JWT_SECRET` value.

### Step 4: Save the file

Save `.env.local` and close the editor.

---

## Part 5: Add to Vercel (Production)

**When ready to deploy:**

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add each environment variable from above
3. Set Environment: **Production, Preview, Development**
4. Click **Save**

---

## Verification Checklist

Before proceeding to implementation, verify you have:

- ✅ Canvas LTI 1.3 Client ID
- ✅ Canvas LTI 1.3 Deployment ID
- ✅ Canvas Instance URL
- ✅ Canvas REST API Client ID
- ✅ Canvas REST API Client Secret
- ✅ YouTube Data API v3 Key
- ✅ JWT Secret (generated)
- ✅ All values added to `.env.local`
- ✅ Both Canvas Developer Keys are **ENABLED** (green toggle)

---

## Troubleshooting

**Don't have Canvas admin access?**
- Request from your IT department with this guide
- Or sign up for Canvas Free-for-Teacher account

**Can't find Developer Keys section?**
- You need admin role in Canvas
- Contact your Canvas administrator

**LTI Key not appearing in course?**
- Make sure key is **enabled** (green toggle)
- Check that **Course Navigation** placement is checked
- Try refreshing Canvas course page

**YouTube API quota exceeded?**
- Free tier: 10,000 units/day (each video metadata request = ~3 units)
- Should be plenty for testing
- Can request quota increase if needed

**Need help?**
- Canvas LTI docs: https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html
- YouTube API docs: https://developers.google.com/youtube/v3/getting-started

---

## Next Steps

Once you have all credentials:

1. ✅ Update `.env.local` with your credentials
2. ✅ Restart Next.js dev server: `npm run dev`
3. ✅ Proceed to full implementation plan
4. ✅ Start building with Phase 1 (Database Schema)

**Ready to proceed?** Let me know once you have the credentials and I'll move to Option 2 (expand full plan) and Option 1 (start building)!
