# Deploying Shipster to Vercel

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`
3. **Git Repository**: Push your code to GitHub/GitLab/Bitbucket

---

## Important: Database Consideration

**⚠️ SQLite Database Limitation on Vercel**

Vercel's serverless environment is **ephemeral**, meaning:
- SQLite database resets on each deployment
- Data is lost between function invocations
- Not suitable for production with SQLite

### Recommended Solutions:

#### Option 1: Use Vercel Postgres (Recommended)
```bash
# In your Vercel project dashboard:
# Storage > Create Database > Postgres
```

#### Option 2: Use Turso (Serverless SQLite)
1. Sign up at [turso.tech](https://turso.tech)
2. Create a database
3. Update connection string in environment variables

#### Option 3: Deploy Backend Separately
- Deploy frontend to Vercel
- Deploy backend to Railway/Render/Fly.io (supports persistent SQLite)
- Update `VITE_API_BASE` to point to backend URL

---

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub**
   ```bash
   cd /Users/somtonweke/Shipster
   git init
   git add .
   git commit -m "Initial commit - Shipster MVP"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your Shipster repo
   - Vercel auto-detects settings

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   ```
   VITE_API_BASE=/api
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-project.vercel.app`

---

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   cd /Users/somtonweke/Shipster
   vercel
   ```

4. **Follow Prompts**
   ```
   ? Set up and deploy "~/Shipster"? [Y/n] y
   ? Which scope do you want to deploy to? [Your account]
   ? Link to existing project? [y/N] n
   ? What's your project's name? shipster
   ? In which directory is your code located? ./
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## Current Setup (Frontend Only on Vercel)

Since SQLite doesn't work on Vercel serverless, here's the recommended approach:

### Frontend on Vercel

**Deploy just the frontend:**

1. **Update `vercel.json`** to only deploy frontend:
   ```json
   {
     "buildCommand": "cd frontend && npm install && npm run build",
     "outputDirectory": "frontend/dist",
     "framework": "vite",
     "installCommand": "cd frontend && npm install"
   }
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Backend on Railway (Free Tier with Persistent SQLite)

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Shipster repo

3. **Configure Backend Service**
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Add Environment Variables** (in Railway)
   ```
   NODE_ENV=production
   PORT=3000
   ```

5. **Get Backend URL**
   - Railway will give you a URL like: `https://shipster-backend.railway.app`

6. **Update Frontend Environment Variable** (in Vercel)
   ```
   VITE_API_BASE=https://shipster-backend.railway.app/api
   ```

7. **Redeploy Frontend on Vercel**

---

## Quick Deploy Script (Frontend Only)

```bash
#!/bin/bash

cd /Users/somtonweke/Shipster/frontend

# Build frontend
npm run build

# Deploy to Vercel
vercel --prod
```

---

## Alternative: All-in-One Vercel Deploy (Use Vercel Postgres)

If you want to deploy everything on Vercel:

1. **Create Vercel Postgres Database**
   - Go to your Vercel project
   - Storage > Create Database > Postgres

2. **Update Backend to Use Postgres** (instead of SQLite)
   - Install `pg`: `npm install pg`
   - Replace SQLite queries with Postgres

3. **Use the provided `vercel.json`** at project root

4. **Deploy**
   ```bash
   vercel --prod
   ```

---

## Environment Variables Needed

### Frontend (Vercel)
```
VITE_API_BASE=/api          # If backend on same domain
# OR
VITE_API_BASE=https://your-backend.railway.app/api  # If backend separate
```

### Backend (Railway/Render)
```
NODE_ENV=production
PORT=3000
```

---

## Post-Deployment Checklist

- [ ] Frontend loads at Vercel URL
- [ ] Can create an artifact
- [ ] Can start a block timer
- [ ] Can save content
- [ ] Ugly Draft Mode works
- [ ] Font/RTL settings work
- [ ] Auto-save works
- [ ] Ship functionality works
- [ ] Data persists after refresh

---

## Troubleshooting

### "API calls failing"
- Check `VITE_API_BASE` environment variable
- Ensure backend is running and accessible
- Check CORS settings if backend is on different domain

### "Data lost after refresh"
- SQLite not persisting on Vercel
- Deploy backend to Railway/Render OR use Vercel Postgres

### "Build fails"
- Check build logs in Vercel dashboard
- Ensure all dependencies in package.json
- Verify build command in settings

---

## Recommended Production Setup

**Best approach for MVP:**

1. **Frontend**: Vercel (free tier)
2. **Backend**: Railway (free tier with persistent storage)
3. **Database**: SQLite (on Railway) or Turso

**Total cost: $0/month** for MVP with persistent data

---

## Next Steps After Deployment

1. Set up custom domain (if desired)
2. Enable Vercel Analytics
3. Set up error monitoring (Sentry)
4. Add CI/CD with GitHub Actions
5. Consider migrating to Postgres for scale

---

Need help? Check:
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Turso Documentation](https://docs.turso.tech)
