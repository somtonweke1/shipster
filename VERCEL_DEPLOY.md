# Deploy FORCE to Vercel

## Prerequisites

1. GitHub account
2. Vercel account (free tier is fine)
3. Railway or Render account (for backend with persistent SQLite)

---

## Step-by-Step Deployment

### Step 1: Push to GitHub (2 min)

```bash
cd /Users/somtonweke/Shipster

git init
git add .
git commit -m "FORCE v1 - Execution enforcement system"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/force.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel (2 min)

1. Go to: [vercel.com/new](https://vercel.com/new)

2. Click "Import Git Repository"

3. Select your `force` repo

4. Configure build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add environment variable:
   ```
   VITE_API_BASE = https://YOUR_BACKEND_URL/api
   ```
   (You'll update this after deploying backend)

6. Click "Deploy"

### Step 3: Deploy Backend to Railway (2 min)

1. Go to: [railway.app](https://railway.app)

2. Sign in with GitHub

3. Click "New Project" → "Deploy from GitHub repo"

4. Select your `force` repo

5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
   - **Environment Variables**: (none needed for MVP)

6. Railway will generate a URL like: `https://force-production.up.railway.app`

### Step 4: Connect Frontend to Backend (1 min)

1. Go back to Vercel dashboard

2. Navigate to your project → Settings → Environment Variables

3. Update `VITE_API_BASE`:
   ```
   VITE_API_BASE = https://force-production.up.railway.app/api
   ```

4. Go to Deployments → Latest Deployment → "Redeploy"

### Done! 🎯

Your FORCE deployment is live:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://force-production.up.railway.app`

---

## Testing Your Deployment

1. Open your Vercel URL
2. Click "CREATE ARTIFACT"
3. Fill in:
   - Name: "Test artifact"
   - Type: Paper
   - Ship deadline: 2 days
   - Max word count: 500
   - External recipient: "test@example.com"
   - Done criteria: "Draft written"
4. Click "LOCK & CREATE"
5. Start a 30-min block
6. Write content
7. Verify scope lock enforces word limit
8. Mark done → submit shipping proof → ship
9. Complete autopsy

If all steps work, deployment is successful.

---

## Cost Breakdown

- **Vercel**: Free tier (unlimited bandwidth, 100GB/month)
- **Railway**: Free trial ($5/month after) OR Free tier with limits
- **Total**: ~$0-5/month for MVP

---

## Troubleshooting

### "Cannot connect to API"
- Check `VITE_API_BASE` in Vercel settings
- Ensure Railway backend is running (check logs)
- Verify CORS is enabled in backend

### "Data not persisting"
- Railway automatically handles SQLite persistence
- Check Railway logs for database errors
- Verify `/app/backend` directory has write permissions

### "Build fails on Vercel"
- Check build logs in Vercel dashboard
- Verify `frontend/package.json` has all dependencies
- Ensure `vite.config.ts` is correctly configured

### "Build fails on Railway"
- Check Railway build logs
- Verify `backend/package.json` has all dependencies
- Ensure TypeScript compiles without errors

---

## Alternative: All-in-One Vercel (Not Recommended)

If you want to deploy everything on Vercel (requires Vercel Postgres):

1. Create Vercel Postgres database in dashboard
2. Migrate backend from SQLite to Postgres
3. Use the `vercel.json` at project root
4. Deploy with `vercel --prod`

**Note**: This requires significant backend changes. Separate deployment (Frontend on Vercel, Backend on Railway) is easier for MVP.

---

## Next Steps After Deployment

1. ✅ Test all enforcement rules
2. ✅ Ship your first artifact using FORCE
3. ✅ Set up custom domain (optional)
4. ✅ Monitor Railway usage
5. ✅ Share with others who need execution enforcement

---

**Your FORCE deployment should now be operational.**

No motivation. No choice. Force throughput.
