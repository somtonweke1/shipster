# Shipster - Quick Start Guide

## What You Built

An **execution enforcement system** that converts high-variance operators into predictable shippers.

### Core Enforcement Rules:

1. **ONE active artifact** at a time (blocked at API level)
2. **Max 7-day ship deadline** (hard cap, no extensions)
3. **30-minute work blocks** with diff detection
4. **Ugly Draft Mode** - backspace limited, no formatting, forward-only writing
5. **Auto-ship at deadline** - no negotiation
6. **Day 3-4 completion gate** - scope reduces on failure
7. **Reliability score** - tracks blocks & ships only

---

## Start the Application

### Option 1: Use the startup script
```bash
./start.sh
```

### Option 2: Manual start

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

Then open: `http://localhost:5173`

---

## How to Use

### 1. Create Your First Artifact
- Click "CREATE ARTIFACT"
- Name it (e.g., "Research Paper Draft")
- Choose type (paper, deck, code, application)
- Set ship deadline (1-7 days)
- **ENFORCEMENT:** Only ONE artifact allowed at a time

### 2. Start a 30-Minute Block
- Choose expected diff type (paragraph, section, slide, etc.)
- Block timer starts (30 minutes)
- **ENFORCEMENT:** Must produce ≥50 characters of new content
- Block auto-ends after 30 minutes

### 3. Enable Ugly Draft Mode (Recommended)
- Check "UGLY DRAFT MODE"
- **ENFORCEMENTS ACTIVE:**
  - Backspace limited to 20 characters
  - No Cmd+B, Cmd+I, Cmd+U (formatting blocked)
  - No cut/copy (prevents reordering)
  - Spellcheck disabled
  - Monospace font only

**This is the core differentiator.** It mechanically kills perfectionism.

### 4. Work Until Ship
- Content auto-saves every 3 seconds
- Timer shows days until ship deadline
- **At Day 3-4:** System checks for complete draft
  - Missing → scope auto-reduces
- **At deadline:** Artifact auto-ships and locks

### 5. Review Reliability Score
- Tracks blocks completed with diffs
- Tracks on-time ships
- **Does NOT track quality** (by design)

---

## Enforcement Examples

### Blocked: Creating Second Artifact
```
ERROR: "BLOCKED: Only one active artifact allowed. Ship current artifact first."
```

### Blocked: Ship Deadline > 7 Days
```
ERROR: "BLOCKED: Ship date cannot exceed 7 days."
```

### Blocked: Backspace Abuse in Ugly Mode
```
ALERT: "BLOCKED: Backspace limit reached (20 characters). Move forward only."
```

### Blocked: Formatting in Ugly Mode
```
ALERT: "BLOCKED: No formatting in ugly mode. Just write."
```

### Failed Block (No Diff)
```
ALERT: "BLOCK FAILED: No meaningful diff detected."
```
This reduces future autonomy (tracked in reliability score).

---

## Architecture

```
Backend (Port 3000)
├── SQLite database (shipster.db)
├── Artifact enforcement service
├── Block execution service
└── Auto-ship background task (runs every minute)

Frontend (Port 5173)
├── Artifact Manager UI
├── Ugly Draft Editor (core differentiator)
└── Block Timer with diff detection
```

---

## Key Files

### Backend
- `backend/src/services/artifactService.ts` - Artifact & shipping rules
- `backend/src/services/blockService.ts` - 30-min block enforcement
- `backend/src/db/schema.ts` - Database schema

### Frontend
- `frontend/src/components/UglyDraftEditor.tsx` - Ugly mode enforcement
- `frontend/src/components/BlockTimer.tsx` - 30-min timer
- `frontend/src/components/ArtifactManager.tsx` - Main UI

---

## Testing the Enforcement

### Test 1: One Artifact Rule
1. Create an artifact
2. Try to create a second one → BLOCKED

### Test 2: Ugly Draft Mode
1. Enable "UGLY DRAFT MODE"
2. Try to press Cmd+B → BLOCKED
3. Try to backspace more than 20 chars → BLOCKED
4. Try to cut/copy text → BLOCKED

### Test 3: Block Diff Detection
1. Start a block (choose "paragraph")
2. Type < 50 characters
3. End block manually → FAILED (no diff)
4. Start another block
5. Type > 50 characters
6. End block → COMPLETED

### Test 4: Auto-Ship
1. Create artifact with 1-day deadline
2. Wait for deadline to pass
3. System auto-ships and locks artifact

---

## What This App Does NOT Do

- ❌ Goal setting
- ❌ Motivation
- ❌ Journaling
- ❌ Reflection prompts
- ❌ Quality metrics
- ❌ Encouragement

**Why?** These feed avoidance for high-variance operators.

---

## Next Steps

### Use It to Ship This README

1. Create artifact: "Shipster Documentation"
2. Type: "paper"
3. Ship deadline: 2 days
4. Enable Ugly Draft Mode
5. Start 30-min block (type: "section")
6. Write ugly draft of documentation
7. Ship on time

**Success metric:** Did you ship?

---

## Troubleshooting

### Backend won't start
```bash
cd backend
rm -f shipster.db  # Reset database
npm run dev
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### CORS errors
- Ensure backend is running on port 3000
- Ensure frontend is running on port 5173

---

## Success Metric

**% of weeks with ≥1 shipped artifact (on time)**

Track this yourself. The app tracks it in the reliability score.

---

Ready to ship predictably? Start now:
```bash
./start.sh
```
