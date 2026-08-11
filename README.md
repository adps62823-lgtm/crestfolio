# Crestfolio

Crestfolio is a personal, production-minded Indian market research operating system for:

- Mutual funds
- Equities
- Commodities
- Macros and benchmarks
- News and event intelligence
- AI-assisted research notes

This repository is intentionally single-user for now. It uses only free building blocks and a local SQLite database so you can run it without paid infrastructure.

## Stack

- Next.js App Router
- TypeScript
- Node 24 built-in SQLite
- TradingView Lightweight Charts
- Local Ollama AI support
- PDF and CSV export pipeline

## Run locally

1. Install dependencies
2. Copy `.env.example` to `.env`
3. Run `npm run dev`

The first boot seeds a local research universe so the app is immediately useful even before live source connectors are enabled.

## What is included

- Institutional-style home briefing
- Equity, mutual fund, and commodity universe views
- Screener studio
- Asset detail pages with charting and events
- Research notes with export
- AI copilot powered by Ollama when available
- Settings for data freshness and model configuration

## Design goals

- Fast on day one
- Free to run
- Single-user and private by default
- Easy to evolve into live ingestion later
- Clear separation between data, analytics, UI, and AI
