# Drift

`Drift` is a swipe-based outdoor discovery app built for the hackathon. The product helps users discover nearby outdoor experiences that fit their preferences, travel radius, and current conditions.

## Repository Layout

This repository is organized as a simple monorepo:

- `frontend/` - React + Vite client
- `backend/` - FastAPI API
- `docx/` - original feature specification and notes
- `AGENT.md` - project specification distilled from the docs and current architecture decision

## Chosen Stack

- Frontend: `React 18 + Vite`
- Backend: `FastAPI`
- Data storage for MVP: local JSON files
- Weather provider: `OpenWeatherMap`

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Notes

- The original spec referenced `Express`, but this repo is scaffolded for `FastAPI` per the current project direction.
- Product requirements remain based on `docx/Featurespec.md`.
