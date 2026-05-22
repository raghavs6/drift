# Drift Project Specification

## Product Summary

`Drift` is a swipe-based outdoor discovery app. Users should be able to open the app, complete a short onboarding flow, and immediately start swiping through curated nearby experiences such as hiking, kayaking, stargazing, biking, and wildlife activities.

The core product goal is to reduce planning friction by replacing search-heavy discovery with a ranked feed of outdoor experiences that are relevant to the user's tastes and the current moment.

## MVP Goals

- Deliver a mobile-first web app focused on fast discovery.
- Keep onboarding under 20 seconds with mostly tap-based inputs.
- Show only experiences that make sense for the user's location, travel radius, and current conditions.
- Learn lightweight preference signals from swipe behavior.
- Let users save right-swiped experiences into collections.

## Target User

Primary users are people aged 18-35 who want to do more outdoor activities but do not want to spend time searching, filtering, and comparing listings.

## Core User Flow

1. User opens the app.
2. User completes onboarding with location, travel distance, and preference inputs.
3. App generates an initial ranked stack of nearby experiences.
4. User swipes left to skip, right to save, and taps or swipes up for details.
5. Saved items appear in collections such as `Saved` and `Bucket List`.
6. Future card ranking improves based on swipe behavior.

## Onboarding Requirements

### Required Inputs

- Location: geolocation first, manual override as fallback.
- Max travel distance: `15 min`, `30 min`, `1 hr`, or `2 hr`.
- Age range.
- Kid-friendly toggle, with child age follow-up when enabled.

### Optional Inputs

- Activity vibes: choose 3-5 categories.
- Comfort level: `Casual`, `Moderate`, or `Adventurous`.

## Core Product Features

### Swipe Discovery

Each experience card should include:

- Hero image
- Title
- One-line hook
- Distance from user
- Difficulty
- Cost
- Estimated time
- Best season
- Real-time condition badge

### Detail View

Each experience detail screen should include:

- Image gallery
- Expanded description
- Map and drive time
- Conditions breakdown
- What-to-bring checklist
- Save to collection action
- Share action

### Collections

- Provide default collections: `Saved` and `Bucket List`.
- Support user-created collections.
- Collections should list saved experiences with compact metadata.

### Recommendation Engine

The recommendation engine should adapt based on:

- Activity category preference
- Distance preference
- Difficulty preference
- Cost sensitivity
- Time preference
- Real-time condition fit

Initial ranking for new users should rely on onboarding preferences plus condition score.

## Condition Layer

Condition scoring should use a combination of:

- Current weather
- Forecast data
- Seasonality
- Time of day
- Simple MVP heuristics for activity suitability

Condition badges should support:

- `Perfect right now`
- `Great this week`
- `Check conditions`
- `Not ideal right now`

## Architecture Decision

The original feature spec described `React + Express`, but this repository should use the following implementation stack instead:

- Frontend: `React 18 + Vite`
- Styling: `Tailwind CSS` or simple CSS during early scaffolding
- State management: React context or local reducer-based state
- Backend: `Python + FastAPI`
- Persistence for MVP: local JSON files
- Weather integration: `OpenWeatherMap`
- Optional AI text generation: Anthropic or another provider behind backend services

## Monorepo Layout

The repository should use this top-level structure:

```text
/
├── AGENT.md
├── README.md
├── .gitignore
├── docx/
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
└── backend/
    ├── requirements.txt
    └── app/
```

## Backend Responsibilities

The FastAPI backend should own:

- onboarding preference persistence
- ranked experience retrieval
- single experience detail retrieval
- swipe recording
- collection creation and retrieval
- weather aggregation
- condition evaluation

Target API surface for MVP:

- `POST /api/preferences`
- `GET /api/experiences`
- `GET /api/experiences/{id}`
- `POST /api/swipe`
- `GET /api/collections`
- `POST /api/collections`
- `POST /api/collections/{id}/add`
- `GET /api/weather`

## Frontend Responsibilities

The React frontend should own:

- onboarding flow
- swipe card stack
- detail modal or detail page
- collection views
- loading and empty states
- mobile-first UX and transitions

## Data Model Guidance

MVP data should center around:

- `Experience`
- `UserPreferences`
- `SwipeRecord`
- `PreferenceVector`
- `Collection`

Keep models simple and serializable so they can be stored as JSON during the hackathon phase.

## Build Priorities

1. Create the monorepo foundation.
2. Implement onboarding and app shell.
3. Seed experience data for the Madison, WI region.
4. Build swipe interactions and detail view.
5. Add condition badges and ranking logic.
6. Add collections and persistence.
7. Polish mobile responsiveness and demo flows.

## Engineering Notes

- Optimize for demo reliability over feature breadth.
- Prefer pre-generated seed content over runtime-heavy generation.
- Cache weather lookups when possible.
- Do not block the swipe flow on optional services.
- Keep API contracts stable and explicit between `frontend` and `backend`.
