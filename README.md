# BottleRush 🍺

On-demand alcohol delivery platform — Blinkit for booze.

## Stack
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **Frontend:** Vanilla HTML/CSS/JS + Leaflet.js
- **Deploy:** Koyeb (Docker)

## Project Structure

```
bottlerush/
├── server.js              ← Express API + URL rewriting
├── package.json
├── Dockerfile
├── .env.example
└── public/
    ├── index.html         ← / (home)
    ├── menu.html          ← /menu
    ├── cart.html          ← /cart (+ Leaflet GPS map)
    ├── order-confirm.html ← /order-confirm
    ├── css/style.css
    └── js/
        ├── app.js         ← Cart state, toast, age gate
        ├── map.js         ← Leaflet GPS
        └── menu.js        ← Product fetch + filter
```

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI

# 3. Run
npm run dev   # nodemon (hot reload)
# or
npm start     # plain node
```

App runs at http://localhost:3000

## Deploy to Koyeb

### Option A: Koyeb CLI
```bash
# Install Koyeb CLI
brew install koyeb/tap/koyeb   # macOS
# or download from https://github.com/koyeb/koyeb-cli

# Login
koyeb login

# Deploy
koyeb app create bottlerush \
  --docker . \
  --port 3000 \
  --env MONGO_URI="mongodb+srv://..." \
  --env PORT=3000
```

### Option B: Koyeb Dashboard (Recommended for first deploy)

1. Push your code to GitHub
2. Go to https://app.koyeb.com → **Create Service**
3. Select **Docker** → connect your GitHub repo
4. Set **Port** to `3000`
5. Add environment variables:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `PORT` = `3000`
6. Click **Deploy**

Koyeb auto-detects the `Dockerfile` and builds/deploys.

### After Deploy
- Update `KOYEB_URL` in `.env` to your Koyeb app URL (e.g., `https://bottlerush-xxxx.koyeb.app`)
- The frontend resolves `API_BASE` automatically from `window.location.origin` in production

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check (used by Koyeb) |
| GET | `/api/products` | All products (`?category=beer`) |
| GET | `/api/products/:id` | Single product |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/:id` | Get order |

## URLs (No .html extension)
- `/` → Home
- `/menu` → Product catalogue
- `/cart` → Cart + GPS checkout
- `/order-confirm` → Order success

## MongoDB Collections
- `products` — auto-seeded with 12 products on first boot
- `orders` — created on each order placement

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `PORT` | Optional | Server port (default: 3000) |

## v2 Roadmap
- [ ] OTP-based auth
- [ ] Razorpay payment integration
- [ ] Admin dashboard
- [ ] Real-time order tracking
- [ ] Multi-store routing
