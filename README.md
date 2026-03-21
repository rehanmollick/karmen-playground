# Karmen Playground

An interactive demo of AI-powered construction scheduling — built as a portfolio piece for the [Karmen](https://karmen.ai) founding team.

Select a pre-loaded project (or generate one from scope text) and immediately explore three capabilities:

1. **Schedule Builder** — AI generates a CPM schedule from scope text. Edit it via natural language chat. Full Gantt chart with critical path highlighting.
2. **Change Order Simulator** — Select a change order, see the fragnet impact, before/after Gantt comparison with animated delay counter, and LLM-generated impact narrative.
3. **Risk Analysis Dashboard** *(the differentiator)* — 10,000-iteration Monte Carlo simulation with PERT distributions, completion probability histogram, P50/P80/P95 confidence dates, and Spearman correlation tornado chart.

Zero sign-up. Select a project and the full demo is live in seconds.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | Python 3.11, FastAPI, Pydantic v2, Uvicorn |
| LLM | Google Gemini 2.5 Flash + Flash-Lite (`google-genai` SDK) |
| CPM Engine | NetworkX (forward/backward pass, FS/SS/FF/SF dependencies with lag) |
| Monte Carlo | NumPy (PERT Beta sampling, 10K vectorized iterations), SciPy (Spearman correlation) |
| Database | None — in-memory cache + JSON seed data |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Running Locally

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # add your GEMINI_API_KEY
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```bash
# backend/.env
GEMINI_API_KEY=<from Google AI Studio — free>
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_PER_HOUR=10
CACHE_TTL_SECONDS=3600

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Seed Projects

| Project | Activities | Duration | Type |
|---------|-----------|----------|------|
| Lakewood Residence — 3-Story Custom Home | 39 | ~180d | Residential |
| Summit Office — Commercial Tenant Improvement | 35 | ~98d | Commercial |
| Cedar Creek Bridge — Highway Bridge Replacement | 39 | ~285d | Infrastructure |

Each includes 3 pre-loaded change orders with realistic fragnet data.

---

## Disclaimer

This is a demo portfolio project. Not affiliated with or endorsed by Karmen. AI-generated schedules are for demonstration purposes only and should not be used for actual project planning.

---

Built by [Rehan Mollick](https://linkedin.com/in/rehanmollick)
