# ShopGo

Full-stack e-commerce application with a Go backend and React frontend. Features user auth (JWT), product catalog (FakeStore API), cart, wishlist, orders, reviews, and Stripe checkout.

## Tech Stack

| Layer    | Stack |
| -------- | ----- |
| Backend  | Go 1.22+, [Gin](https://github.com/gin-gonic/gin), [GORM](https://gorm.io), PostgreSQL |
| Frontend | React 18, TypeScript, [Vite](https://vitejs.dev), [Tailwind CSS](https://tailwindcss.com), Zustand, TanStack Query |
| Auth     | JWT (access token in memory, refresh in httpOnly cookie) |
| Payments | [Stripe](https://stripe.com) (test mode) |
| Products | [FakeStore API](https://fakestoreapi.com) (no API key required) |

## Prerequisites

- **Go** 1.22 or later  
- **Node.js** 18+ and npm  
- **PostgreSQL** (local or hosted, e.g. Supabase)  
- **Stripe** account (test keys)  
- (Optional) **Git** for cloning  

## Project Structure

```
shopgo/
├── backend/                 # Go API
│   ├── cmd/server/          # Entrypoint
│   ├── internal/            # Auth, cart, order, payment, product, review, wishlist
│   ├── pkg/                 # Config, DB, response, validator, cache
│   └── migrations/          # SQL migrations
├── frontend/                # React SPA
│   └── src/
│       ├── api/             # API client and endpoints
│       ├── components/      # UI and layout
│       ├── hooks/           # React Query and custom hooks
│       ├── pages/           # Route pages
│       ├── store/           # Zustand stores
│       └── types/           # TypeScript types
├── .cursorrules             # Project rules for Cursor
├── .gitignore
└── README.md
```

## Quick Start

### 1. Clone and enter repo

```bash
git clone https://github.com/Rakesh2908/shopgo.git
cd shopgo
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env   # if you have one; otherwise create .env
```

Create `backend/.env` with at least:

```env
PORT=8080
ENVIRONMENT=development
DATABASE_URL=postgres://user:password@localhost:5432/shopgo?sslmode=disable
JWT_SECRET=your-long-random-secret-at-least-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=168h
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # optional for local; needed for webhooks
FAKESTORE_BASE_URL=https://fakestoreapi.com
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

- **Optional:** `DATABASE_POOLER_URL` – use if your host requires a pooler (e.g. Supabase session pooler).  
- **Optional:** `STRIPE_WEBHOOK_SECRET` – required when receiving Stripe webhooks (e.g. payment confirmation).

Run migrations (GORM auto-migrates on startup; for manual SQL, run `migrations/001_initial.sql` if needed), then start the server:

```bash
go mod download
go run ./cmd/server
```

API base: `http://localhost:8080` (API under `/api/v1`).

### 3. Frontend setup

In a new terminal:

```bash
cd frontend
cp .env.example .env.local   # if you have one; otherwise create .env.local
npm install
npm run dev
```

Create `frontend/.env.local` if the API is not on the same host:

```env
VITE_API_URL=http://localhost:8080
```

Open **http://localhost:5173**. The app will call the backend at `VITE_API_URL` + `/api/v1`.

### 4. Stripe (checkout)

- Use [Stripe test keys](https://dashboard.stripe.com/test/apikeys).  
- Card numbers never hit your server; use [Stripe.js / Elements](https://stripe.com/docs/stripe-js) (as in this app).  
- For local webhook testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli) and set `STRIPE_WEBHOOK_SECRET` in `backend/.env`.

#### Stripe CLI & webhooks (local)

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

In a **separate terminal tab** (while the backend is running):

```bash
stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe
```

Copy the webhook signing secret it prints (`whsec_...`), paste it into `backend/.env` as `STRIPE_WEBHOOK_SECRET`, then restart the backend.

#### Test Stripe payment (checkout)

Use these test card numbers at checkout:

| Use case     | Card number           | Expiry     | CVC  | ZIP   |
| ------------ | --------------------- | ---------- | ---- | ----- |
| Success      | `4242 4242 4242 4242` | Any future (e.g. 12/29) | Any 3 digits (e.g. 123) | Any (e.g. 12345) |
| 3D Secure    | `4000 0027 6000 3184` | Any future | Any 3 digits | Any   |

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Required | Description |
| --------------------- | -------- | ----------- |
| `PORT`                | No       | Server port (default `8080`) |
| `ENVIRONMENT`         | No       | `development` \| `production` |
| `DATABASE_URL`        | Yes      | PostgreSQL connection string |
| `DATABASE_POOLER_URL` | No       | Pooler URL if required by provider |
| `JWT_SECRET`          | Yes      | Secret for signing JWTs (min 32 chars) |
| `JWT_ACCESS_TTL`      | No       | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_TTL`     | No       | Refresh token TTL (e.g. `168h`) |
| `STRIPE_SECRET_KEY`   | Yes      | Stripe secret key (test: `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | No     | Webhook signing secret (`whsec_...`) |
| `FAKESTORE_BASE_URL`  | No       | FakeStore API base (default `https://fakestoreapi.com`) |
| `CORS_ALLOWED_ORIGINS`| Yes      | Comma-separated origins (e.g. `http://localhost:5173`) |

### Frontend (`frontend/.env.local`)

| Variable       | Required | Description |
| -------------- | -------- | ----------- |
| `VITE_API_URL` | No      | Backend base URL (e.g. `http://localhost:8080`). Empty = same origin. |

**Never commit `.env` or `.env.local`.** They are listed in `.gitignore`. Use `.env.example` (without secrets) for documentation.

## Scripts

### Backend

```bash
cd backend
go run ./cmd/server          # Run API
go build -o server ./cmd/server
go test ./...                # Run tests
```

### Frontend

```bash
cd frontend
npm run dev      # Dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Design and Conventions

- **Colors:** Primary `#0F172A`, accent `#2563EB`, background `#F8FAFC`, surface `#FFFFFF`.  
- **Font:** Inter (Google Fonts).  
- **UI:** Tailwind, minimal layout, skeleton loaders for product grids, responsive (mobile-first).  
- **Security:** Access token in memory only; refresh in httpOnly cookie; BCrypt cost 12; Stripe Elements for cards; webhook signature verification.

## License

MIT (or as specified in the repo).
