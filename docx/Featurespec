# Drift — Technical & Functionality Specification

**Version:** 1.0 — Hackathon MVP
**Date:** April 11, 2026
**Platform:** Web application (React)

---

## 1. Product Overview

### 1.1 What Is Drift?

Drift is a swipe-based discovery app for outdoor experiences. Users open the app, see curated experience cards (kayaking, hiking, stargazing, cliff jumping, etc.) near them, and swipe right to save or left to skip. The app learns user preferences over time through swipe behavior and surfaces experiences filtered by real-time conditions — weather, season, and time of day — so users only see things that are actually good to do *right now*.

### 1.2 Core Value Proposition

AllTrails makes you search. Eventbrite makes you browse. Drift comes to you. It solves the paradox of choice that kills outdoor planning by replacing search-and-filter with a personalized feed of actionable experiences.

### 1.3 Key Differentiators

- **Experience cards, not trail listings** — each card is a complete experience with context (difficulty, cost, time, best season), not just a pin on a map.
- **Real-time condition filtering** — only surfaces experiences that are good to do right now based on weather, season, and time of day.
- **Swipe-based discovery** — no search, no filters, no decision fatigue. Open and start swiping.
- **AI-powered taste learning** — tracks swipe patterns to build a preference profile and re-rank the card stack.

### 1.4 Target User

18–35-year-olds who want to do more outdoor activities but get stuck in the planning phase. They know they want to "do something this weekend" but don't know what's available, what's in season, or what matches their vibe.

---

## 2. Functionality Specification

### 2.1 Onboarding Flow

The onboarding flow collects the minimum information needed to generate a personalized card stack. Target completion time: under 20 seconds. All inputs are tappable — no typing required.

#### Screen 1 — Location & Distance

| Field | Type | Details |
|-------|------|---------|
| Location | Auto-detect + manual override | Uses browser Geolocation API. Fallback: city/zip text input. |
| Max travel distance | Slider | Options: 15 min / 30 min / 1 hr / 2 hr. Determines the radius for experience surfacing. |

#### Screen 2 — About You

| Field | Type | Details |
|-------|------|---------|
| Age range | Single-select buttons | 18–24 / 25–34 / 35–44 / 45–54 / 55+. Used to adjust default card ranking (not hard filtering). |
| Kid-friendly toggle | Yes / No | If Yes, show follow-up: age of youngest child (Under 5 / 5–12 / 13–17). Filters out experiences with safety concerns for the selected age group. |

#### Screen 3 — Preferences (Optional, Skippable)

| Field | Type | Details |
|-------|------|---------|
| Activity vibes | Multi-select visual grid (pick 3–5) | Categories: Hiking, Water Sports, Climbing, Biking, Camping, Fishing, Winter Sports, Stargazing, Foraging, Wildlife. Cold-starts the recommendation engine. |
| Comfort level | Single-select | Casual / Moderate / Adventurous. Maps to difficulty filter on cards. |

#### Post-Onboarding

- No account creation required before first swipe.
- Sign-up prompt triggers when user attempts to save to a collection (conversion hook).
- A contextual banner appears: "X experiences are great to do today near [location]" to create immediate pull into the swipe flow.

### 2.2 Swipe Interface (Core Loop)

#### Card Design

Each experience card displays:

| Element | Source | Example |
|---------|--------|---------|
| Hero image | Curated dataset / Unsplash API | Sunrise over Devil's Lake |
| Experience title | Dataset | "Sunrise Kayaking on Devil's Lake" |
| One-line hook | Claude-generated | "Glass-calm water, bluff reflections, and zero crowds before 7am" |
| Distance from user | Calculated from lat/long | "45 min from you" |
| Difficulty | Dataset tag | Easy / Moderate / Hard |
| Cost | Dataset | Free / $15 rental / $40 guided |
| Estimated time | Dataset | "2–3 hours" |
| Best season | Dataset | "May – September" |
| Real-time condition badge | Weather API + logic | "Perfect today" / "Great this week" / "Not ideal right now" (greyed) |

#### Swipe Mechanics

| Gesture | Action | Visual Feedback |
|---------|--------|----------------|
| Swipe right | Save experience | Green checkmark overlay, card flies right |
| Swipe left | Skip experience | Red X overlay, card flies left |
| Swipe up | View full details (expand card) | Card expands to full-screen detail view |
| Tap card | View full details | Same as swipe up |

#### Card Stack Behavior

- Stack displays 3 cards visually (top card active, 2 peeking behind).
- Cards are pre-loaded in batches of 10 from the ranked experience list.
- When the user reaches card 7 of 10, the next batch of 10 is fetched and appended.
- Cards already swiped are never shown again (tracked via local state, or user account if signed in).

### 2.3 Experience Detail View

Triggered by swipe-up or tap on any card. Expands to a full-screen view with:

- Full-size image gallery (2–4 images)
- Complete description (2–3 paragraphs, Claude-generated)
- Map showing location with distance/drive time from user
- Conditions breakdown: current weather at location, trail/water conditions (if available), crowd level estimate (time-of-day based heuristic)
- "What to bring" checklist (e.g., sunscreen, water shoes, headlamp)
- "Save to Collection" button
- "Share" button (copy link)
- Back button returns to swipe stack at same position

### 2.4 Collections

- Users can save swiped-right experiences into named collections.
- Default collections: "Saved" (all right-swipes), "Bucket List"
- Custom collections: user-created (e.g., "Summer 2026," "Day Trips with Friends")
- Collections are list views showing saved cards with key info (title, distance, difficulty, condition badge).
- Tapping a saved card opens the detail view.

### 2.5 Recommendation Engine (Taste Learning)

#### Preference Vector

The system tracks a lightweight preference profile based on swipe history:

| Dimension | Values | Updated By |
|-----------|--------|------------|
| Activity type | Weights per category (hiking: 0.8, water: 0.6, etc.) | +0.1 on right swipe for that category, -0.05 on left swipe |
| Distance preference | Average saved distance | Running average of right-swiped experience distances |
| Difficulty preference | Weighted toward most-saved difficulty | +0.1 for saved difficulty level |
| Cost sensitivity | Average saved cost | Running average of right-swiped experience costs |
| Time preference | Short (< 2hr) / Medium (2–4hr) / Long (4hr+) | Weighted by swipe direction |

#### Ranking Algorithm

Each unseen experience receives a score:

```
score = (category_weight × 0.4)
      + (distance_fit × 0.2)
      + (difficulty_fit × 0.15)
      + (cost_fit × 0.1)
      + (condition_score × 0.15)
```

- `condition_score` boosts experiences with favorable real-time conditions.
- New users (< 10 swipes) get a default ranking based on onboarding preferences + condition score.
- Cards are sorted by score descending and served as the swipe stack.

### 2.6 Real-Time Conditions Layer

#### Data Sources

| Condition | Source | Update Frequency |
|-----------|--------|-----------------|
| Weather | OpenWeatherMap API (free tier) | Every 30 minutes |
| Season | Static dataset tag per experience | N/A (pre-tagged) |
| Time of day | Client clock | Real-time |
| Trail/water conditions | Hardcoded heuristics for MVP (e.g., "no kayaking if wind > 15mph") | Tied to weather updates |

#### Condition Logic (MVP)

Each experience has a `conditions` object defining ideal parameters:

```json
{
  "ideal_weather": ["clear", "partly_cloudy"],
  "max_wind_mph": 12,
  "min_temp_f": 50,
  "max_temp_f": 95,
  "best_months": [5, 6, 7, 8, 9],
  "best_time_of_day": ["morning", "evening"],
  "rain_ok": false
}
```

The condition engine evaluates current conditions against these parameters and assigns a badge:

- **"Perfect right now"** — all conditions met, current time within best window
- **"Great this week"** — forecast shows ideal conditions in next 7 days
- **"Check conditions"** — some conditions marginal (e.g., slightly windy)
- **"Not ideal right now"** — card still shown but visually muted and ranked lower

### 2.7 Social Layer (Post-MVP / Stretch Goal)

Not included in hackathon MVP. Noted for pitch deck:

- See what friends saved
- Share collections publicly
- "X friends saved this" social proof on cards

---

## 3. Technical Specification

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────┐
│                   CLIENT                     │
│         React SPA (Vite + React 18)          │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Onboarding│ │Swipe View│ │  Collections │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│         │            │              │        │
│         └────────────┼──────────────┘        │
│                      │                       │
│              React Context API               │
│         (user prefs, swipe history)          │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTPS
                       │
┌──────────────────────┼───────────────────────┐
│                   SERVER                      │
│           Node.js + Express                   │
│                                              │
│  ┌──────────────┐ ┌─────────────────────┐    │
│  │ Experience    │ │ Recommendation      │    │
│  │ API           │ │ Engine              │    │
│  └──────┬───────┘ └──────────┬──────────┘    │
│         │                    │               │
│  ┌──────┴───────┐ ┌─────────┴──────────┐    │
│  │ Condition     │ │ Claude API         │    │
│  │ Engine        │ │ (description gen)  │    │
│  └──────┬───────┘ └────────────────────┘    │
│         │                                    │
│  ┌──────┴───────┐                            │
│  │ OpenWeather   │                            │
│  │ API Client    │                            │
│  └──────────────┘                            │
│                                              │
│         JSON file store (MVP)                │
└──────────────────────────────────────────────┘
```

### 3.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Vite | Fast dev cycle, team familiarity from CS 320 |
| Swipe UI | react-tinder-card | Battle-tested swipe card library, minimal setup |
| Styling | Tailwind CSS | Rapid prototyping, utility-first |
| State management | React Context + useReducer | Lightweight, no external dependencies |
| Backend | Node.js + Express | Single-language stack, fast API development |
| Database | JSON files (MVP) | No DB setup overhead for hackathon. Flat JSON files for experiences, user prefs. |
| Weather API | OpenWeatherMap (free tier) | 1,000 calls/day free, current + forecast endpoints |
| AI / Descriptions | Anthropic Claude API (claude-sonnet-4-20250514) | Experience description generation, one-line hooks |
| Maps | Google Maps Embed or Mapbox | Detail view location display |
| Hosting | Vercel (frontend) + Railway (backend) | Free tiers, instant deploys, zero config |

### 3.3 Data Model

#### Experience Object

```typescript
interface Experience {
  id: string;                    // unique ID (e.g., "devils-lake-kayak-sunrise")
  title: string;                 // "Sunrise Kayaking on Devil's Lake"
  hook: string;                  // one-line description
  description: string;           // full 2-3 paragraph description
  images: string[];              // URLs to images (Unsplash or local assets)
  category: Category;            // enum: hiking | water | climbing | biking | camping | fishing | winter | stargazing | foraging | wildlife
  location: {
    name: string;                // "Devil's Lake State Park"
    lat: number;
    lng: number;
    region: string;              // "Southern Wisconsin"
  };
  difficulty: "easy" | "moderate" | "hard";
  cost: {
    amount: number;              // 0 for free
    note: string;                // "kayak rental" or "free with state park sticker"
  };
  estimatedTime: {
    min: number;                 // hours
    max: number;
  };
  bestSeason: number[];          // months [5, 6, 7, 8, 9]
  conditions: {
    idealWeather: string[];
    maxWindMph: number;
    minTempF: number;
    maxTempF: number;
    bestTimeOfDay: string[];
    rainOk: boolean;
  };
  kidFriendly: {
    suitable: boolean;
    minAge: number;              // minimum recommended age
    notes: string;               // "life jackets provided for kids 5+"
  };
  whatToBring: string[];         // ["sunscreen", "water shoes", "dry bag"]
  tags: string[];                // freeform tags for search/filtering
}
```

#### User Preferences Object

```typescript
interface UserPreferences {
  location: { lat: number; lng: number };
  maxTravelMinutes: number;      // 15 | 30 | 60 | 120
  ageRange: string;              // "18-24" | "25-34" | etc.
  kidFriendly: boolean;
  childAgeRange?: string;        // "under5" | "5-12" | "13-17"
  activityVibes: Category[];     // selected categories
  comfortLevel: string;          // "casual" | "moderate" | "adventurous"
}
```

#### Swipe History Object

```typescript
interface SwipeRecord {
  experienceId: string;
  direction: "left" | "right";
  timestamp: number;
}

interface PreferenceVector {
  categoryWeights: Record<Category, number>;   // 0.0 to 1.0
  avgSavedDistance: number;
  difficultyWeights: Record<string, number>;
  avgCost: number;
  timePreference: "short" | "medium" | "long";
}
```

#### Collection Object

```typescript
interface Collection {
  id: string;
  name: string;
  experienceIds: string[];
  createdAt: number;
}
```

### 3.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/preferences` | Save onboarding preferences, returns initial card stack |
| GET | `/api/experiences?lat=X&lng=Y&radius=Z` | Fetch ranked experiences for location with real-time conditions |
| GET | `/api/experiences/:id` | Fetch single experience detail |
| POST | `/api/swipe` | Record swipe (body: `{ experienceId, direction }`) |
| GET | `/api/collections` | List user collections |
| POST | `/api/collections` | Create collection |
| POST | `/api/collections/:id/add` | Add experience to collection |
| GET | `/api/weather?lat=X&lng=Y` | Fetch current + forecast weather for location |

### 3.5 Frontend Component Tree

```
<App>
├── <OnboardingFlow>
│   ├── <LocationStep>         // geolocation + distance slider
│   ├── <AboutYouStep>         // age range + kid-friendly toggle
│   └── <PreferencesStep>      // activity grid + comfort level
├── <SwipeView>
│   ├── <ConditionBanner>      // "12 experiences perfect for today"
│   ├── <CardStack>            // react-tinder-card wrapper
│   │   └── <ExperienceCard>   // individual swipeable card
│   └── <SwipeControls>        // manual left/right/up buttons
├── <DetailView>
│   ├── <ImageGallery>
│   ├── <ConditionsBreakdown>
│   ├── <MiniMap>
│   └── <WhatToBring>
├── <CollectionsView>
│   ├── <CollectionList>
│   └── <CollectionDetail>
└── <NavBar>                   // bottom nav: Discover | Collections | Profile
```

### 3.6 Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-tinder-card": "^1.6.x",
    "react-router-dom": "^6.x",
    "tailwindcss": "^3.x",
    "axios": "^1.x",
    "express": "^4.x",
    "cors": "^2.x",
    "@anthropic-ai/sdk": "latest"
  }
}
```

### 3.7 Hackathon Build Plan

#### Phase 1 — Foundation (Hours 0–6)

- [ ] Initialize React + Vite project with Tailwind
- [ ] Build onboarding flow (3 screens, state management)
- [ ] Set up Express backend with JSON file store
- [ ] Create seed dataset: 30–40 Madison-area experiences as JSON

#### Phase 2 — Core Loop (Hours 6–18)

- [ ] Implement card stack with react-tinder-card
- [ ] Design and build experience card component
- [ ] Wire up swipe recording (left/right state tracking)
- [ ] Integrate OpenWeatherMap API for condition badges
- [ ] Build condition evaluation engine
- [ ] Implement basic ranking algorithm (weighted score)

#### Phase 3 — Detail & Collections (Hours 18–28)

- [ ] Build detail view with image gallery, map, conditions
- [ ] Implement collections (save, create, view)
- [ ] Connect Claude API for experience description generation
- [ ] Build preference vector updater (post-swipe recalculation)

#### Phase 4 — Polish & Demo (Hours 28–36)

- [ ] UI polish: animations, transitions, loading states
- [ ] Mobile responsiveness (primary demo is likely phone-sized)
- [ ] Build 3–5 demo scenarios for judges
- [ ] Deploy to Vercel + Railway
- [ ] Prepare pitch deck slides

### 3.8 Demo Dataset (Madison, WI Region)

Sample experiences for the MVP seed dataset:

| Experience | Category | Difficulty | Cost | Distance |
|-----------|----------|------------|------|----------|
| Sunrise Kayaking, Devil's Lake | Water | Easy | $15 rental | 45 min |
| Ice Age Trail — Table Bluff Segment | Hiking | Moderate | Free | 35 min |
| Picnic Point Sunset Walk | Hiking | Easy | Free | 5 min |
| Governor Dodge Rock Scramble | Climbing | Hard | $8 park pass | 50 min |
| Pheasant Branch Conservancy Bird Walk | Wildlife | Easy | Free | 15 min |
| Lake Mendota Stand-Up Paddleboarding | Water | Easy | $20 rental | 10 min |
| Blue Mound Night Sky Viewing | Stargazing | Easy | $8 park pass | 40 min |
| Devil's Lake Bluff Trail Loop | Hiking | Hard | $8 park pass | 45 min |
| Wisconsin Dells Kayak the Narrows | Water | Moderate | $25 guided | 55 min |
| Parfrey's Glen Nature Hike | Hiking | Easy | $8 park pass | 50 min |
| Mirror Lake Canoe at Dawn | Water | Easy | $15 rental | 50 min |
| Gibraltar Rock Summit Hike | Hiking | Moderate | Free | 30 min |
| Indian Lake County Park Mountain Biking | Biking | Moderate | Free | 20 min |
| Lake Wingra Fishing (Shoreline) | Fishing | Easy | Free (license req.) | 10 min |
| Sauk Point Cliff Jumping | Water | Hard | Free | 45 min |

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenWeatherMap rate limits | Condition badges stop updating | Cache weather data per region, refresh every 30 min instead of per-request |
| Seed dataset too small | Users run out of cards quickly | Curate 40+ experiences and add variety across all categories |
| Swipe library bugs on mobile browsers | Core loop breaks in demo | Test on multiple devices early; have desktop fallback with click buttons |
| Claude API latency for description gen | Slow card loading | Pre-generate all descriptions at build time, store in JSON dataset |
| Judges compare to AllTrails | Novelty questioned | Lead pitch with real-time conditions layer and swipe UX, not feature list |

---

## 5. Success Metrics (Pitch Framing)

For the hackathon pitch, frame around these metrics even if measured qualitatively:

- **Time to first swipe** — target < 30 seconds from app open
- **Swipe engagement** — users swipe through 10+ cards in a session
- **Condition relevance** — "Perfect today" badges match actual current weather
- **Discovery value** — users find at least one experience they didn't know about

---

## 6. Future Roadmap (Post-Hackathon)

Noted for pitch deck "where this goes" slide:

1. **Expanded dataset** — crowdsourced experience submissions, partnership with state parks and outfitters
2. **Real trail conditions** — NPS API integration, AllTrails condition scraping, user-reported updates
3. **Social layer** — friend activity feeds, shared collections, group trip planning
4. **Booking integration** — direct booking for paid experiences (rental, guided tours)
5. **Native mobile app** — React Native for push notifications (seasonal alerts, condition changes)
6. **Monetization** — affiliate fees on bookings, premium "pro" tier with unlimited collections and advanced condition alerts
