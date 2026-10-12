# EarthScape — Climate Intelligence Platform (frontend)

A production-quality React frontend for a climate monitoring and analytics
workspace: ingestion, cleaning, analytics, forecasting, anomaly detection,
alerting and reporting.

This repository is **frontend only**. It runs entirely on deterministic mock
data out of the box, and every service call is written against a documented
REST contract so a Python backend can be connected without touching page code.

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite 8, TypeScript 6 (strict) |
| UI | React 19, React Router 7 |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| Charts | Recharts 3 |
| Maps | React Leaflet 5 + Leaflet |
| Motion | Framer Motion 14 (respects `prefers-reduced-motion`) |
| Icons | Lucide React |
| HTTP | Axios behind a single `httpClient` wrapper |
| Dates | date-fns |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional; defaults already use mock data
npm run dev                  # http://localhost:5173
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with `/api` proxy to `VITE_PROXY_TARGET` |
| `npm run build` | Type-check all projects, then produce a production bundle |
| `npm run lint` | oxlint over `src` |
| `npm run preview` | Serve the built output from `dist` |

> On Windows PowerShell, invoke these as `npm.cmd` / `npx.cmd` — PowerShell
> blocks `npm.ps1` by default.

## Mock mode and backend integration

`VITE_USE_MOCK_API` defaults to `true`. While it is set, every service resolves
from the fixtures in `src/data`, including simulated latency, so loading,
empty and error states behave realistically.

To connect a backend:

1. Implement the endpoints documented in `src/services/*.ts` (each method
   carries a `REST contract:` comment with its method, path and body).
2. Create `.env.local` and set:

   ```ini
   VITE_USE_MOCK_API=false
   VITE_API_BASE_URL=/api/v1
   VITE_PROXY_TARGET=http://127.0.0.1:8000   # dev only
   ```

3. Restart the dev server.

`src/services/httpClient.ts` owns the switch, so no page or component changes
are required. Errors are normalised to `ApiError` and surfaced through the
shared `ErrorState` / `OfflineState` components.

### Endpoints expected from the backend

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `POST /auth/signup`, `GET /auth/session`, `POST /auth/logout`, `PATCH /profile`, `PATCH /settings` |
| Climate | `GET /climate/records`, `GET /climate/stations`, `GET /climate/datasets`, `GET /climate/network-series`, `POST /climate/ingest` |
| Cleaning | `GET /cleaning/datasets`, `GET /cleaning/{id}/summary`, `POST /cleaning/{id}/run` |
| Upload | `POST /uploads` (multipart) |
| Analytics | `GET /analytics/summary`, `GET /analytics/series`, `GET /analytics/correlations`, `GET /analytics/extremes` |
| Monitoring | `GET /alerts`, `PATCH /alerts/{id}`, `GET /alerts/counts`, `GET /alerts/rules`, `GET /anomalies`, `PATCH /anomalies/{id}` |
| Predictions | `GET /predictions/series`, `GET /predictions/models`, `GET /predictions/generated-at` |
| Reports | `POST /reports/preview`, `POST /reports`, `GET /reports`, `GET /reports/{id}/download` |
| Support | `GET /support/faq`, `GET /support/tickets`, `POST /support/tickets`, `POST /support/feedback` |

## Demonstration access

Authentication is mocked, but the sign-in form validates like the real thing.

| Email | Password | Role |
| --- | --- | --- |
| `amina.rahman@earthscape.example` | `Earthscape2026` | administrator |
| `mateo.okafor@earthscape.example` | `Earthscape2026` | analyst |

The login screen has a **Fill demonstration credentials** button.

## Routes

| Path | View |
| --- | --- |
| `/login`, `/signup` | Authentication (guest-only) |
| `/` | Network dashboard |
| `/climate-data` | Records, datasets and station register |
| `/climate-data/upload` | CSV ingestion wizard |
| `/climate-data/cleaning` | Quality review and pipeline runs |
| `/analytics` | Trends, correlations and extremes |
| `/predictions` | Forecasts, intervals and model registry |
| `/anomalies` | Anomaly register and investigation |
| `/alerts` | Alert inbox and threshold rules |
| `/reports` | Report builder, preview and history |
| `/support` | Knowledge base, tickets and feedback |
| `/settings` | Notifications, thresholds and appearance |
| `/profile` | Identity, role and session |
| `/404` | Not found (any unmatched path redirects here) |

Everything except `/login` and `/signup` requires a session; unauthenticated
visitors are redirected to sign in and returned to their original destination.

## Project layout

```
src/
  components/       Reusable UI: common/, charts/, maps/, dashboard/, account/
  data/             Deterministic fixtures and seeded generators
  hooks/            useAsync, useAuth, useAppearance, useToast, table controls
  layouts/          AppLayout (shell), AuthLayout, PageHeader
  pages/            One module per route
  routes/           Router tree, path constants, navigation, guards
  services/         API layer and mock/real switch
  styles/           Design tokens, dark mode, density, Leaflet overrides
  types/            Domain contracts
  utils/            Formatting, dates, cn, seeded randomness
```

## Conventions

- **Tokens over literals.** Colours, spacing, radii and typography come from
  `src/styles/index.css`; components reference `bg-surface`, `text-ink-muted`,
  `border-line` and friends.
- **Density is a variable.** `--cell-pad-x`, `--row-pad-y` and
  `--surface-pad` respond to the compact/comfortable preference in Settings.
- **Four states everywhere.** Data surfaces handle loading, success, error and
  empty through `Skeleton`, `ErrorState` and `EmptyState`.
- **Accessible by default.** Labelled controls, `aria-pressed` / `aria-checked`
  on toggles, visible focus rings, a skip link, keyboard shortcuts (`/` and
  Ctrl/Cmd+K to search) and `prefers-reduced-motion` support.
- **Mock data is plausible.** Values come from seeded generators rather than
  hard-coded literals, so charts, KPIs and tables stay internally consistent.

## Known limitations

- Mock mode does not persist ingested uploads between reloads.
- The report download returns a text manifest instead of a rendered PDF; the
  renderer belongs to the backend.
- Charts export is disabled pending a server-side figure renderer.
- Map tiles require network access; the station overlay renders from fixtures
  regardless.
