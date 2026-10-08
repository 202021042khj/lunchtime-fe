# lunchtime-fe

Personal Next.js App Router starter template — a scaffold to clone for new frontend projects, with an opinionated architecture convention and a ported design system already wired up.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config — no `tailwind.config.*`, tokens live in `app/globals.css`)

> This is a recent/unusual Next.js version. Before writing Next.js-specific code (routing, config, etc.), check `node_modules/next/dist/docs/` — see `AGENTS.md`.

## Getting started

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint

## Project structure

```
app/
├── layout.tsx        # root layout (fonts, <NotifyContainer />)
├── globals.css        # Tailwind v4 tokens + design system tokens
├── (main)/            # route group → "/", your real app starts here
└── example/            # reference pages only, see below → "/example", "/example/[id]"

components/
├── pages/             # page-route components, mirrors the app/ route tree
├── ui/                # ported design system (Button, Dialog, Modal, Notify, Table, ...)
└── common/            # shared, domain-agnostic primitives (Badge, AsyncBoundary, ...)

hooks/                 # page-level + shared hooks (flat)
lib/                   # pure helpers, no React (formatDate, cn())
types/                 # one file per domain concept
constants/             # one file per domain concept
```

Full conventions (naming, Desktop/Mobile split, section modularization, theming rules) are documented in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — read it before adding a new page or component.

`app/example/` is not a real feature — it's worked reference code showing the page pattern end to end. Once you're familiar with it, delete `app/example/` (and its supporting `hooks/usePostsListLogic.ts`, `hooks/usePostDetailLogic.ts`, `constants/posts.ts`, `types/post.ts`) and build your real pages under `app/(main)/`.

## Design system

`components/ui/` is a design system ported from an internal admin template: Button, Dialog, AlertDialog, Popover, Tooltip, Command palette, Combobox, Modal/ConfirmModal, Notify (toast), Table/SortableTable, and a small icon set — Radix UI + shadcn "new-york" style underneath. `components.json` is set up so the shadcn CLI can add more (`npx shadcn add <name>`).

Dark mode is automatic (`prefers-color-scheme`, no manual toggle). Always use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, ...) instead of hardcoded Tailwind grays so components stay theme-aware — see the Theming section in `docs/ARCHITECTURE.md` for the full rationale and a known gap in the ported kit's own color palette.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
