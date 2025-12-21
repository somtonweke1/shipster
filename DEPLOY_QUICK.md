# Quick Vercel Deployment Guide

## Fastest Path to Production

### Step 1: Push to GitHub

```bash
cd /Users/somtonweke/Shipster

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Shipster MVP"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/shipster.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel

**Option A: Via Vercel Dashboard (Easiest)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `shipster` repo
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   ```
   VITE_API_BASE = https://YOUR_BACKEND_URL/api
   ```
6. Click "Deploy"

**Option B: Via CLI**

```bash
npm install -g vercel
vercel login
cd frontend
vercel --prod
```

### Step 3: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `shipster` repo
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
6. Railway will give you a URL like: `https://shipster-production.up.railway.app`

### Step 4: Connect Frontend to Backend

1. Go back to Vercel dashboard
2. Project Settings → Environment Variables
3. Update `VITE_API_BASE`:
   ```
   VITE_API_BASE = https://shipster-production.up.railway.app/api
   ```
4. Redeploy: Deployments → Latest → Redeploy

### Done! 🎉

Your app is live at:
- Frontend: `https://your-project.vercel.app`
- Backend: `https://shipster-production.up.railway.app`

---

## Testing Deployment

1. Open your Vercel URL
2. Create an artifact
3. Start writing
4. Verify auto-save works
5. Test ugly mode
6. Ship an artifact

---

## Troubleshooting

**"Cannot connect to API"**
- Check `VITE_API_BASE` in Vercel settings
- Ensure Railway backend is running
- Check Railway logs for errors

**"Data not persisting"**
- Railway should handle SQLite persistence
- Check Railway volume is attached
- Verify database file location

**"Build fails on Vercel"**
- Check build logs
- Ensure all dependencies in package.json
- Verify root directory is set to `frontend`

---

## Cost

- **Vercel**: Free tier (plenty for MVP)
- **Railway**: $5/month after free trial OR free tier with limits
- **Total**: ~$0-5/month

---

## Alternative: Frontend Only (Backend Local)

If you just want to deploy the frontend:

1. Keep backend running locally
2. Use ngrok to expose local backend:
   ```bash
   npx ngrok http 3000
   ```
3. Set `VITE_API_BASE` to ngrok URL in Vercel
4. This is NOT for production, just testing!

---

Read full deployment guide: **DEPLOYMENT.md**
