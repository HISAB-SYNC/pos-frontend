# MiniShop Frontend

MiniShop is the frontend foundation for a SaaS POS and shop-management platform. This repository is set up as a modular Next.js App Router application with a feature-based structure, shadcn/ui primitives, and shared infrastructure for auth, RBAC, forms, tables, state, and API access.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- React Hook Form
- TanStack Table
- Framer Motion
- Nuqs
- next-themes

## Installation

```bash
npm install
```

## Development Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Environment Variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_API_URL=
```

## Folder Structure

- `src/app/` contains routing and page composition.
- `src/components/ui/` contains shadcn/ui primitives.
- `src/components/shared/` contains reusable application-level components.
- `src/components/layout/` contains dashboard shell composition.
- `src/features/` contains domain-specific business modules.
- `src/lib/` contains API, auth, RBAC, validations, utilities, and constants.
- `src/stores/` contains Zustand state slices.
- `src/types/` contains shared type definitions.
- `src/config/` contains application configuration.
- `src/styles/` contains global styling and design tokens.

## shadcn/ui Rules

- Keep shadcn primitives in `src/components/ui/`.
- Prefer composition over rewriting primitive internals.
- Reuse `cn()` from `src/lib/utils.ts` for class merging.
- Keep the design system token-driven through CSS variables.

## Architecture Rules

- Keep feature code inside `src/features/<feature>/`.
- Put reusable UI in `src/components/shared/` only when it is genuinely cross-feature.
- Keep URL state in Nuqs, not Zustand.
- Keep global state small and domain-specific.
- Keep API access behind `src/lib/api/`.
- Keep role and permission checks centralized in `src/lib/permissions/`.

## Git Workflow

- Work on feature branches.
- Keep commits focused and small.
- Do not mix foundation setup with business features.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` before pushing.
