# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build (use to verify changes)
pnpm lint         # ESLint
pnpm gen:types    # Regenerate Supabase types → src/lib/database.types.ts
```

## Architecture

**Stack:** Next.js 16 (App Router) + Tailwind v4 + shadcn/ui (New York, Zinc) + Supabase + pnpm

### App Structure

- `src/app/(dashboard)/` — main route group with sidebar layout. Server components fetch data, client components handle interaction.
- `src/app/actions/` — server actions
- `src/app/auth/` — Supabase auth callback
- `src/app/login/` — login page (outside dashboard layout)

### Supabase

- **Clients:** `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (RSC/actions), `src/lib/supabase/middleware.ts` (session refresh)
- **Types:** `src/lib/database.types.ts` (generated), `src/lib/types.ts` (aliases and composed types)
- **Supabase project repo:** `../ham_qrg_supabase/` (migrations, edge functions, config.toml)
- `sync_runs` table is not in generated types — uses manual type + `from("sync_runs" as never)` cast

### RBAC

- JWT custom claims via Supabase auth hook: `user_role` injected into access token
- Server-side: `src/lib/rbac.ts` — `getUserRole()`, `hasPermission()`, `isAdmin()` (parse JWT payload)
- Client-side: `src/hooks/use-user-role.ts` — same JWT parsing in a React hook
- Roles: `admin`, `bridge_manager`, `viewer`
- Permission map is hardcoded in `rbac.ts`, DB has `role_permissions` table for RLS `authorize()` function
- Sidebar visibility and page guards both use role checks

### Key Patterns

- **Tables with FK ambiguity:** When a table has `user_id` referencing both `auth.users` and `profiles`, PostgREST needs explicit FK hints: `profiles!constraint_name(columns)`
- **Self-referencing FK:** Supabase returns arrays — cast with `as unknown as`
- **URL state:** `nuqs` for search params (filters, pagination)
- **Data tables:** `@tanstack/react-table` with server-side pagination
- **Edge functions:** Invoked via `supabase.functions.invoke()` with explicit `method: "POST"`, `JSON.stringify(body)`, and `Content-Type: application/json` header
- **Toasts:** `sonner` — import `toast` from `"sonner"`

## Gotchas

- Next.js 16 middleware deprecation warning (still works)
- Supabase `database.types.ts` doesn't include all tables (e.g., `sync_runs`, `iz8wnh_points_to_sync`) — use manual types with `as never` cast on `.from()`
- RLS on tables accessed by the auth hook requires policies for `supabase_auth_admin` role, not just `authenticated`
- `to_jsonb()` on Postgres enum types causes polymorphic type errors — cast to `text` first
