# Deploy Shipster in 5 Minutes

## 🎯 Recommended Setup (Free)

**Frontend**: Vercel
**Backend**: Railway
**Total Cost**: $0/month (with limits)

---

## Quick Deploy Steps

### 1. Push to GitHub (2 min)

```bash
cd /Users/somtonweke/Shipster
git init
git add .
git commit -m "Shipster MVP"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/shipster.git
git push -u origin main
```

### 2. Deploy Frontend (1 min)

Visit: [vercel.com/new](https://vercel.com/new)

- Import your GitHub repo
- Root Directory: `frontend`
- Framework: Vite
- Deploy

### 3. Deploy Backend (1 min)

Visit: [railway.app/new](https://railway.app/new)

- Connect GitHub repo
- Root Directory: `backend`
- Deploy

### 4. Connect Them (1 min)

In Vercel:
- Settings → Environment Variables
- Add: `VITE_API_BASE = https://YOUR-RAILWAY-URL/api`
- Redeploy

**Done!** ✅

---

## What You Get

✅ Live frontend at `yourproject.vercel.app`
✅ Working backend API
✅ Persistent SQLite database
✅ Auto-deploys on git push
✅ HTTPS by default
✅ Free tier (enough for MVP)

---

## Test Your Deployment

1. Open Vercel URL
2. Create artifact → Start writing
3. Refresh page → Data persists
4. Enable ugly mode → Test enforcements
5. Ship artifact → Auto-export works

---

## Need Help?

- **Full guide**: See `DEPLOYMENT.md`
- **Quick reference**: See `DEPLOY_QUICK.md`
- **Issues**: Check build logs in Vercel/Railway dashboards

---

**Next**: Share your Vercel URL and start shipping! 🚀
