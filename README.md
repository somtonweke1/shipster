# FORCE / v1

**Execution enforcement system for low-reliability operators.**

---

## What is FORCE?

**FORCE** is an **execution kernel** that converts inconsistent shippers into predictable ones by:

- Removing choice
- Compressing scope
- Enforcing throughput

---

## Enforcement Rules

### 1. Single Artifact Rule
- **ONE active artifact** at any time
- Starting a new artifact **auto-archives** the old one
- No parallel projects, no meta-work

### 2. Scope Lock Compiler
- Max word count defined at creation (immutable)
- Exceeding limit **blocks further writing**
- Must delete content to proceed
- Kills over-modeling and abstraction drift

### 3. Time-Box Enforcement
- Work only in **30-minute execution blocks**
- Blocks require visible output (diff detection)
- Failed blocks logged permanently
- No streaks, only failure visibility

### 4. Edit Lock
- After "Done Criteria Met" → **no more edits**
- Only actions: Ship or Archive
- No polish loops, no perfection paralysis

### 5. External Reality Gate
- Artifact cannot ship without proof of external contact
- Requires: URL, screenshot, or email confirmation
- No internal completion allowed

### 6. Post-Ship Autopsy
- 5 yes/no questions (mandatory)
- No narrative, no journaling
- Builds calibration, not self-critique loops

### 7. Hard Prohibitions
- No open-ended planning
- No meta-framework creation
- No retrospective justification
- No emotional tagging

---

## Quick Start

### Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open: **http://localhost:5173**

---

## Deploy to Vercel

### Option 1: Via Vercel Dashboard

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "FORCE v1"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. Import to Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repo
   - Root Directory: `frontend`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add env variable: `VITE_API_BASE=/api` (or your backend URL)

3. Deploy backend separately to Railway/Render (for persistent SQLite)

### Option 2: Frontend-Only Deployment

```bash
cd frontend
npm run build
vercel --prod
```

**See `DEPLOYMENT.md` for full deployment guide.**

---

## Architecture

```
force/
├── backend/              # Node.js + Express + SQLite
│   ├── src/
│   │   ├── db/          # Schema with FORCE constraints
│   │   ├── services/    # Enforcement logic (Scope Lock, Edit Lock, etc.)
│   │   └── routes/      # API endpoints
├── frontend/            # React + TypeScript + Tailwind
│   └── src/
│       └── components/  # Brutal, clinical UI (no motivation)
```

---

## What You Get

After using FORCE consistently:

✓ **Execution reliability** increases
✓ **Public artifact trail** accumulates
✓ **Reputation** shifts from "smart" → "useful"
✓ **Identity** detaches from performance volatility
✓ **Optionality** collapses into leverage

---


**This product will feel constraining, boring, and disrespectful to your intelligence.**


---

## What FORCE Does NOT Do

- ❌ Goal setting
- ❌ Motivation
- ❌ Journaling
- ❌ Reflection prompts
- ❌ Streaks or gamification
- ❌ Quality metrics
- ❌ Encouragement

**Why?** These feed avoidance for high-variance operators.

---

## Success Metric

**% of weeks with ≥1 shipped artifact (on time)**

No other metric matters.

---

## License

MIT
