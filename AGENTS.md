# NPApp — AI Agent Instructions

## Project Overview

**NPApp** is the unified web application for Nara Packing (NP). It replaces multiple standalone systems with a single Next.js codebase.

- **Current modules**: NP Label (price label generator + print)
- **Planned**: NP SlipCheck (payment slip verification) — migrate from `/www/wwwroot/abucode/npSlipCheck/`
- **Language**: Thai UI, English code identifiers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | Node.js 20+ |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 with custom design system |
| Icons | lucide-react |
| Database | MongoDB via Mongoose 9 |
| Font | IBM Plex Sans Thai Looped |
| Server | aaPanel Node Project Manager |

## Project Structure

```
npapp/
├── server.js              # Custom entry for aaPanel (node server.js)
├── next.config.ts         # Next.js config (memory-optimized)
├── package.json           # Dependencies (minimal — no ORM bloat)
├── tsconfig.json          # TypeScript strict, path alias "@/*" → "./src/*"
├── AGENTS.md              # ← This file
├── .agents/               # Agent skills (project-local)
│   └── skills/
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── layout.tsx     # Root layout (font, metadata, HTML shell)
│   │   ├── globals.css    # Tailwind + design tokens + component classes
│   │   ├── page.tsx       # Home — SSR, fetches paginated products
│   │   ├── actions.ts     # Server Actions — ALL DB operations
│   │   ├── calculator/    # /calculator — profit margin calculator
│   │   └── print/         # /print — A4 label print preview
│   ├── components/        # Client Components
│   │   ├── ProductList.tsx # Main dashboard (search, paginate, CRUD)
│   │   ├── ProductForm.tsx # Add/edit product form
│   │   ├── Label.tsx       # Price label preview (scalable)
│   │   ├── PrintHeader.tsx # Print page toolbar
│   │   └── Sidebar.tsx     # Navigation sidebar (dark/light toggle)
│   ├── lib/
│   │   ├── db.ts          # Mongoose connection (global cached, pool=5)
│   │   ├── colors.ts      # Category color themes & price card colors
│   │   └── export.ts      # CSV export (client-side, Thai BOM)
│   ├── models/
│   │   └── Product.ts     # Mongoose schema + indexes
│   └── types/
│       └── index.ts       # IProduct, IPrice, constants
```

## Architecture Patterns

### 1. Server Components + Client Components

```
Server Component (page.tsx)
  └─ fetches data via Server Actions
  └─ passes as props to Client Component
      └─ Client Component (useState, events, modals)
```

- **`page.tsx`**: Always a Server Component. Fetches initial data, sets `export const dynamic = 'force-dynamic'`.
- **`layout.tsx`**: Server Component. Only imports font + globals.css. Keep minimal.
- **Components**: Client Components (`'use client'`). Handle interactivity.

### 2. Server Actions Pattern

All database operations live in `src/app/actions.ts` with `'use server'`:

```typescript
// ✅ DO: Server Action calls dbConnect(), queries, serializes _id/Date
// ✅ DO: Use .lean() for read queries (plain objects, not Mongoose documents)
// ✅ DO: return paginated results { products, total, page, totalPages }
// ❌ DON'T: Query without limit — always pass page/limit
```

### 3. MongoDB Connection

- **Global cached singleton**: `global.mongoose` prevents hot-reload reconnections
- **Pool size**: max 5, min 1 (RAM-optimized for shared server)
- **Google DNS override**: For MongoDB Atlas SRV resolution
- **Connect on demand**: `dbConnect()` called inside each Server Action

### 4. Type System

- `IProduct` — client-side interface (`src/types/index.ts`)
- `IProductDocument` — Mongoose document interface (`src/models/Product.ts`)
- Serialization: `.lean()` → map `_id` to string, `Date` to ISO string
- Constants: `PRODUCT_CATEGORIES`, `PRODUCT_UNITS` (Thai strings)

## Coding Conventions

### File Naming
- Components: PascalCase, `.tsx` → `ProductList.tsx`
- Lib/Utils: camelCase, `.ts` → `colors.ts`
- Server Actions: `actions.ts` per route group (currently in root `app/`)

### Imports
- Path alias `@/` → `./src/` (see tsconfig paths)
- Server actions: `import { getProducts } from '@/app/actions'`
- Server-only lib: `import dbConnect from '@/lib/db'` (only in Server Components or Server Actions)

### Styling
- Use design tokens from `globals.css`: `--primary`, `--card`, `--border`, etc.
- Prefer utility classes: `class="card"`, `class="btn btn-primary"`, `class="input"`
- Categories with `getCategoryColor()` from `@/lib/colors`
- Dark mode: `.dark` class from `Sidebar.tsx` toggle

### i18n / Thai Considerations
- All UI text in Thai
- Font: IBM Plex Sans Thai Looped (supports Thai characters)
- Number formatting: `new Intl.NumberFormat('th-TH')`
- CSV export: BOM prefix `\uFEFF` for Excel UTF-8 compatibility
- Locale-sort: `localeCompare(b.name, 'th')`

## Memory Optimization Rules

The app runs on a shared server with limited RAM. Always follow:

1. **Paginate all DB queries**: min limit=50, max=200. Never load all documents.
2. **Server-side search**: debounce → call `searchProducts()` Server Action, not client `.filter()`
3. **Don't hoard state**: Client components should only hold current page data
4. **Mongoose pool**: Keep `maxPoolSize: 5` unless proven needed otherwise
5. **No heavy deps**: Don't add `moment`, `lodash`, `@mui`, `antd`, etc. Use native.

## Deployment (aaPanel)

1. `npm run build` (generates `.next/`)
2. aaPanel Node Project Manager → Startup File: `server.js`
3. Environment variables: `NODE_ENV=production`, `NODE_OPTIONS=--max-old-space-size=200`, `PORT=3002`, `MONGODB_URI=...`

---

## Adding New Features

When adding a new module (e.g., `/slipcheck`):

1. Create route: `src/app/slipcheck/page.tsx`
2. Add server actions: `src/app/slipcheck/actions.ts`
3. Create models: `src/models/SlipCheck.ts`
4. Add types: extend `src/types/`
5. Register in sidebar: add to `navItems` in `Sidebar.tsx`
6. Follow pagination + Server Action pattern (don't load all data)
7. Reuse design system classes (`card`, `btn`, `input`)
