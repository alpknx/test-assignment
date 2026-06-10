# Test Assignment — Million Items List

Two-panel UI with 1,000,000 items, infinite scroll, drag-and-drop, and server-persisted state.

**Live:** https://alpknx.github.io/test-assignment/  
**API:** https://test-assignment-production.up.railway.app

## Features

**Left panel (all items)**
- Infinite scroll — 20 items per load
- Filter by ID (debounced)
- Add custom items (any ID, batched to server every 10s)

**Right panel (selected items)**
- Infinite scroll — 20 items per load
- Filter by ID (debounced)
- Drag & Drop reordering — works with filtered view
- Selection and order persisted across page refreshes

## Stack

| Layer | Tech |
|-------|------|
| Backend | Express.js, in-memory store |
| Frontend | React 18, Vite |
| Drag & Drop | @dnd-kit/sortable |
| Hosting (frontend) | GitHub Pages |
| Hosting (backend) | Railway |

## Request queue

All client requests go through a deduplicating queue:
- **Select / deselect / reorder** — flushed every 1s
- **Add item** — flushed every 10s
- Same ID cannot be enqueued twice

## Running locally

```bash
# Backend
cd backend && npm install && node server.js
# → http://localhost:3001

# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

## Tests

```bash
# Backend (28 tests — store unit + API integration)
cd backend && npm test

# E2E (8 tests — requires both servers running)
npx playwright test
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/items?page=&limit=&filter=` | Paginated unselected items |
| GET | `/api/selected?page=&limit=&filter=` | Paginated selected items |
| POST | `/api/select` | `{ids: number[]}` — select items |
| POST | `/api/deselect` | `{ids: number[]}` — deselect items |
| POST | `/api/items` | `{id: number}` — add custom item |
| PUT | `/api/selected/order` | `{fromIndex, toIndex, filteredIds?}` — reorder |
