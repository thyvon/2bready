# 2bReady Web — Claude Code Context

## What this project is

Next.js 15 frontend for the 2bReady compliance platform. Consumes the `2bready-api` Laravel backend via REST API. Three user types: **companies**, **auditors**, **admins**.

**This repo is the frontend only.** Backend API lives in `2bready-api`. The contract between them is one auto-generated file: `src/types/api.generated.ts` — **never hand-edit it**.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| UI Library | MUI v9.1.2 + Tailwind CSS v4 |
| State | Zustand (persisted auth store) |
| Forms | React Hook Form + Zod |
| HTTP | Axios (with token interceptor) |
| API Types | openapi-typescript (auto-generated) |

## Essential commands

```bash
npm run dev             # start dev server (http://localhost:3000)
npm run build           # production build
npm run type-check      # TypeScript check (no emit)
npm run lint            # ESLint
npm run generate:types  # regenerate API types from backend OpenAPI spec
```

## Project structure

```
src/
├── app/
│   ├── (auth)/             # Public: login, register, forgot-password
│   ├── (dashboard)/
│   │   ├── admin/          # Admin-only pages
│   │   ├── company/        # Company user pages
│   │   └── auditor/        # Auditor pages
│   ├── layout.tsx          # Root layout (MUI ThemeProvider + CssBaseline)
│   └── globals.css         # Tailwind v4 base + CSS custom properties
├── components/
│   ├── ui/                 # Reusable UI components (wrap MUI where needed)
│   ├── layouts/            # Page layout shells (AuthLayout, DashboardLayout)
│   └── forms/              # Shared form components
├── domains/                # Domain-aligned modules (mirrors backend domains)
│   ├── auth/               # Login, register, TOTP actions + hooks
│   ├── company/
│   ├── package/
│   ├── payment/
│   ├── journey/
│   ├── document/
│   ├── audit/
│   ├── trust-badge/
│   ├── notification/
│   ├── support/
│   ├── sop/
│   ├── data-room/
│   └── audit-log/
├── hooks/                  # Shared custom React hooks
├── lib/
│   ├── api.ts              # Axios instance + request/response interceptors
│   └── utils.ts            # formatCents, formatDate, getApiError helpers
├── store/
│   └── auth.store.ts       # Zustand auth store (persisted)
├── theme/
│   └── index.ts            # MUI theme (cssVariables: true, light + dark)
└── types/
    └── api.generated.ts    # AUTO-GENERATED — never edit this file
```

## Domain module structure

Each domain folder follows this pattern:

```
domains/auth/
├── api.ts          # API calls (using lib/api.ts axios instance)
├── hooks.ts        # React Query / custom hooks
├── types.ts        # Local TypeScript types (until generated types are ready)
└── schemas.ts      # Zod validation schemas (used with React Hook Form)
```

## Rules

### Rule #1 — Never hand-edit `api.generated.ts`
Run `npm run generate:types` to regenerate. The backend exports OpenAPI via Scramble.

### Rule #2 — No `any` types
Never use `any` without an inline justification comment. Use `unknown` instead and narrow.

### Rule #3 — Forms use React Hook Form + Zod always
```tsx
const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
```

### Rule #4 — Auth state from Zustand only
Never read/write `localStorage` directly in components. Use `useAuthStore()`.

### Rule #5 — Money is always in cents from the API
Display with `formatCents(amount)` from `lib/utils.ts`. Never divide by 100 inline.

### Rule #6 — Route protection
Admin routes: check `hasAnyRole(['admin', 'staff', 'finance'])`.
Company routes: check `hasRole('company_owner') || hasRole('company_member')`.
Auditor routes: check `hasRole('auditor')`.

## API response envelope

All backend responses follow:
```ts
// Success
{ data: T, meta?: Record<string, unknown> }

// Error
{ message: string, errors?: Record<string, string[]> }
```

Use `getApiError(error)` from `lib/utils.ts` to extract error messages from Axios errors.

## MUI + Tailwind v4 usage

- Use **MUI components** for all interactive elements (Button, TextField, Dialog, etc.)
- Use **Tailwind utilities** for layout and spacing (`flex`, `grid`, `gap-4`, `p-6`, etc.)
- Never use inline `style={{}}` for spacing — use Tailwind classes
- MUI theme uses `cssVariables: true` — access via `var(--mui-palette-primary-main)` in CSS

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8080`) |
| `NEXT_PUBLIC_APP_NAME` | App display name |
