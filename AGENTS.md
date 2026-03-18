# AGENTS.md — Conservacion Amazonica Frontend

Agent context for the `Conservacion-amazonica-frontend` repository. Read this before making any changes.

---

## Project Overview

Next.js 16 (App Router) frontend for **AMZ Desk**, an internal request management system for Conservación Amazónica. Built with React 19, TypeScript (strict mode), Tailwind CSS v4, shadcn/ui components, React Hook Form + Zod for forms, and Zustand for global state.

**Package manager:** `pnpm` (do not use npm or yarn).

---

## Commands

```bash
# Development server (port 3001)
pnpm dev

# Production build
pnpm build

# Lint (ESLint flat config)
pnpm lint

# Lint with auto-fix
pnpm lint --fix

# Format with Prettier
pnpm prettier --write .

# Type-check without emitting
pnpm tsc --noEmit
```

**There are no tests.** No test runner (Jest/Vitest) is configured. Do not add test files unless explicitly asked.

Pre-commit hooks (Husky + lint-staged) run ESLint `--fix` and Prettier on staged `.js/.jsx/.ts/.tsx/.json/.css/.md` files automatically.

---

## Commit Convention

Commits must follow **Conventional Commits** (enforced by commitlint):

```
feat: add PDF download button
fix: correct token injection in desembolsar
chore: update dependencies
refactor: split solicitud adapter into smaller helpers
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`.

---

## Directory Structure

```
app/                  # Next.js App Router pages (Server Components by default)
  dashboard/          # Protected dashboard routes (middleware guards /dashboard/*)
  login/              # Public auth page
  signup/             # Public auth page
components/
  auth/               # Login/signup forms (Client Components)
  layout/             # Sidebar, nav
  solicitudes/        # Core domain forms and display components
  ui/                 # shadcn/ui primitives (do not edit unless customizing)
hooks/                # Custom React hooks (use-*.ts naming)
lib/
  api.ts              # Axios instance with auth interceptors
  adapters/           # Transform form data ↔ backend payloads
  mappers/            # Data transformation utilities
  services/           # API service objects (primary services live here)
  utils.ts            # cn(), formatMoney(), normalizeString()
services/             # Legacy service location — prefer lib/services/ for new code
store/                # Zustand stores (auth-store.ts)
types/                # TypeScript interfaces matching backend contracts
middleware.ts         # Next.js middleware for route protection
```

---

## Code Style

### TypeScript

- `strict: true` is enabled — no implicit `any`.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Derive form types from Zod schemas: `type FormData = z.infer<typeof formSchema>`.
- Avoid `as any`; use type guards or narrowing instead.
- Use `unknown` for caught errors: `catch (error: unknown)`.

### Imports

- Use the `@/` alias for all non-relative imports (maps to the repo root).
- Order: React/Next → third-party → internal (`@/lib`, `@/components`, `@/hooks`, `@/store`, `@/types`).
- Single quotes for strings; no semicolons are **not** the rule here — semicolons are **required** (Prettier: `"semi": true`).

### Formatting (Prettier)

- `singleQuote: true`
- `semi: true`
- `tabWidth: 2`
- `trailingComma: "es5"`
- Tailwind classes are auto-sorted via `prettier-plugin-tailwindcss`.
- Do not manually sort Tailwind classes; let Prettier handle it.

### Naming Conventions

- Files/folders: `kebab-case` (e.g., `solicitud-form.tsx`, `use-catalogos.ts`).
- Components: `PascalCase` named exports (e.g., `export function LoginForm`).
- Hooks: `camelCase` starting with `use` (e.g., `useCatalogos`).
- Services: `camelCase` object with method names (e.g., `solicitudesService.createSolicitud()`).
- Zustand stores: `useXxxStore` (e.g., `useAuthStore`).
- Types/Interfaces: `PascalCase` (e.g., `SolicitudResponse`, `AuthState`).
- Constants/enums: `SCREAMING_SNAKE_CASE` for string literal unions used as enums.

### React / Next.js

- App Router pages are Server Components by default; add `'use client'` only when needed (hooks, event handlers, browser APIs).
- Layouts are async Server Components; use `await cookies()` for cookie access.
- Use `next/navigation` (`useRouter`, `usePathname`) — never `next/router`.
- Prefer named exports for components; use default exports only for Next.js page/layout files.

### Forms

- All forms use **React Hook Form** with `zodResolver`.
- Define schemas in a co-located `*-schema.ts` file.
- Use `z.infer<typeof schema>` to derive the form type.
- Show field errors inline as `<p className="text-sm text-red-500">{errors.field?.message}</p>`.

### API & Services

- All HTTP calls go through the shared `api` Axios instance in `lib/api.ts`.
- The instance injects the Bearer token automatically via a request interceptor.
- Service functions live in `lib/services/` as plain objects (not classes).
- Adapt form data to backend shape in `lib/adapters/` before calling services.
- Handle 401 globally (auto-logout) — do not re-handle in individual services.

### State Management

- Use **Zustand** for global state (`store/`).
- Persist only essential fields with `partialize` (never persist sensitive data beyond what is needed).
- Keep server-derived or ephemeral state in component `useState`/`useReducer`.

### Error Handling

- Surface user-facing errors via `toast.error(message)` from `sonner`.
- In service calls, let errors propagate to the calling component; catch and display there.
- In Zustand actions, `set({ isLoading: false })` before re-throwing so UI unblocks.
- Narrow Axios errors with `axios.isAxiosError(error)` before accessing `.response`.

### Styling

- Tailwind CSS v4 utility classes exclusively — no custom CSS files except `globals.css`.
- Use the `cn()` utility (`lib/utils.ts`) to merge conditional class names.
- Follow the existing shadcn/ui token system (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.).
- Dark mode is supported via `next-themes`; use semantic tokens rather than hardcoded colors.

---

## Key Patterns

### Adding a New Page

1. Create `app/<route>/page.tsx` as a Server Component (default export).
2. If the route needs auth, it is already covered by `middleware.ts` for any path under `/dashboard/*`.
3. Import and compose existing UI components; add `'use client'` only to interactive leaf components.

### Adding a New API Service

1. Create `lib/services/<domain>-service.ts` exporting a plain object.
2. Import the shared `api` instance from `@/lib/api`.
3. Do not manually set `Authorization` headers — the interceptor handles it.

### Adding a New Form

1. Define a Zod schema in a `*-schema.ts` file alongside the form component.
2. Wire with `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`.
3. If data must be sent to the backend in a different shape, create an adapter in `lib/adapters/`.

### Environment Variables

- Prefix with `NEXT_PUBLIC_` for client-accessible vars.
- Current: `NEXT_PUBLIC_API_URL` — the base URL for the backend API.
- `.env` is git-ignored; never commit secrets.

---

## What Not to Do

- Do not install alternative HTTP libraries — use the existing Axios `api` instance.
- Do not use `next/router` (Pages Router) — this project uses App Router.
- Do not write new files in `services/` (legacy); use `lib/services/` instead.
- Do not add global CSS beyond what is in `globals.css`; prefer Tailwind utilities.
- Do not commit directly to `main` without a PR if working collaboratively.
- Do not skip Husky hooks (`--no-verify`); fix lint/format errors instead.
