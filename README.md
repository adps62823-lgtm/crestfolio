# Screener App — Phase 1: Data Pipeline

Multi-asset screener for Mutual Funds, Stocks, and ETFs.
Built with FastAPI + MongoDB Atlas + Celery.

---

## Prerequisites

- Python 3.11+
- Docker Desktop (for Redis locally)
- MongoDB Atlas account (free tier)
- Redis Cloud account (free tier) OR Docker

---

## Step 1 — MongoDB Atlas Setup (5 minutes)

1. Go to https://cloud.mongodb.com and sign up (free)
2. Create a new **Free Cluster** (M0, 512MB)
3. Under **Database Access** → Add a new user with username/password
4. Under **Network Access** → Add `0.0.0.0/0` (allow all IPs for now)
5. Click **Connect** → **Drivers** → copy the connection string

It looks like:
```
mongodb+srv://youruser:yourpassword@cluster0.abcde.mongodb.net/
```

---

## Step 2 — Redis Setup

**Option A — Redis Cloud (free, no Docker needed)**
1. Go to https://redis.com/try-free and sign up
2. Create a free database
3. Copy the connection string: `redis://default:password@hostname:port`

**Option B — Local Docker (easier for dev)**
```bash
docker run -d -p 6379:6379 redis:7-alpine
# Redis URL will be: redis://localhost:6379/0
```

---

## Step 3 — Project Setup

```bash
# Clone / navigate to project
cd screener-app/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env
```

---

## Step 4 — Configure .env

Open `backend/.env` and fill in:

```env
MONGODB_URL=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/
MONGODB_DB_NAME=screener
REDIS_URL=redis://localhost:6379/0   # or your Redis Cloud URL
SECRET_KEY=any-long-random-string-here
```

---

## Step 5 — First-Time Data Fetch

### Mutual Funds (run once, takes ~20-30 minutes for full history)

```bash
cd backend

# Full history fetch (first time only — fetches NAV history for all ~15,000 schemes)
python -m app.pipeline.mf_pipeline --full

# After first run, daily updates are fast (~30 seconds):
python -m app.pipeline.mf_pipeline
```

### Stocks (run once, takes ~2-3 hours for all NSE stocks)

```bash
# All NSE stocks
python -m app.pipeline.stock_pipeline

# Or just a few to test:
python -m app.pipeline.stock_pipeline RELIANCE TCS HDFCBANK INFY
```

### ETFs

```bash
python -m app.pipeline.etf_pipeline
```

---

## Step 6 — Start the API Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Visit: http://localhost:8000/health → should return `{"status": "ok"}`

API docs: http://localhost:8000/docs

---

## Step 7 — Start Daily Auto-Refresh (Celery)

In separate terminals:

```bash
# Terminal 1 — Worker (processes tasks)
celery -A app.pipeline.tasks worker --loglevel=info

# Terminal 2 — Beat (triggers tasks on schedule)
celery -A app.pipeline.tasks beat --loglevel=info
```

Or use Docker Compose for everything:
```bash
cd screener-app
docker-compose up
```

---

## Step 8 — Deploy to Railway (Production)

1. Push your code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add environment variables from your `.env`
4. Railway auto-detects the Dockerfile and deploys

Add Redis as a Railway plugin (free tier available).

---

## Data Summary

| Asset | Source | Fields | Update |
|---|---|---|---|
| Mutual Funds | MFApi.in + AMFI | NAV, 30+ return/risk fields | Daily 7:30 PM |
| Stocks | yfinance (NSE) | Price, 50+ fundamental/technical fields | Daily 8:00 PM |
| ETFs | yfinance (NSE) | Price, returns, AUM | Daily 8:30 PM |

---

## Project Structure

```
backend/
  app/
    core/
      config.py       ← Settings from .env
      database.py     ← MongoDB connection
    models/
      mf.py           ← MutualFund, MFNavHistory documents
      stock.py        ← Stock, StockPriceHistory documents
      etf.py          ← ETF document
      portfolio.py    ← Portfolio, Watchlist documents
    pipeline/
      mf_pipeline.py  ← MF data fetcher + return calculator
      stock_pipeline.py ← Stock data fetcher via yfinance
      etf_pipeline.py ← ETF data fetcher
      tasks.py        ← Celery scheduled tasks
  main.py             ← FastAPI app entry point
  requirements.txt
  .env.example
```

---

## Next: Phase 2

Phase 2 adds:
- DuckDB screener engine (200+ filters, fast queries)
- FastAPI screener endpoints (`/api/v1/screener/mf`, `/api/v1/screener/stocks`)
- Portfolio & watchlist API
- Export to CSV/Excel