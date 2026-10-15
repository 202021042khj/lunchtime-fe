# Architecture Conventions

## Purpose / provenance

This convention is inspired by `recruit-khj` (a prior take-home-test project) but deliberately improves on it rather than copying it verbatim:

- **Single shared props interface.** In the reference, `DesktopPage.tsx` and `MobilePage.tsx` each redefined their own copy of the same props interface. Here, the page-level hook exports one interface; both device components import it.
- **Consistent naming.** The reference had a `Mobilepage.tsx` casing typo. Here it's always `MobilePage.tsx`.
- **Real section composition.** The reference had no section layer — each device component was one large block with comment dividers. Here, pages compose named section components from a `sections/` folder.
- **Centralized constants.** The reference scattered constants inline inside hooks. Here, constant data lives in `constants/`.
- **Added shared infra.** `components/common/`, `types/`, and `lib/` folders didn't exist in the reference; they're part of the base layout here.

## Desktop/Mobile split

Per page-route, create a folder `components/pages/<page-name>/` (kebab-case, matching the route) containing:

```
components/pages/<page-name>/
├── DesktopPage.tsx
└── MobilePage.tsx
```

Rules:

- **All state/logic lives in one hook**, `hooks/use<PageName>Logic.ts`, called exactly once, in `app/.../page.tsx`.
- **The toggle always happens at the page level**, never inside a component's own root `<div>`:

  ```tsx
  "use client";

  export default function Page() {
    const logic = usePageLogic();

    return (
      <div className="flex flex-1 flex-col">
        <div className="hidden md:flex md:flex-1">
          <DesktopPage {...logic} />
        </div>
        <div className="flex flex-1 md:hidden">
          <MobilePage {...logic} />
        </div>
      </div>
    );
  }
  ```

  This is CSS-only (Tailwind `hidden md:flex` / `flex md:hidden`) — no JS media-query hooks, no user-agent sniffing. Both trees mount; the `md:` breakpoint (768px) decides what's visible.

- **The shared props type is the hook's exported return-type interface** (e.g. `UsePostsListLogicResult`), imported by both `DesktopPage.tsx` and `MobilePage.tsx`. Never redefine it per file.

When a route has nested children (e.g. `app/example/page.tsx` + `app/example/[id]/page.tsx`), nest their component folders the same way under a shared parent, matching the route tree: `components/pages/example/list/` + `components/pages/example/detail/`.

Worked example: `components/pages/example/list/` + `hooks/usePostsListLogic.ts`, `components/pages/example/detail/` + `hooks/usePostDetailLogic.ts`.

## Route groups: `(main)` vs `example`

- **`app/(main)/`** is a [route group](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — it's omitted from the URL, so `app/(main)/page.tsx` serves `/`. This is where your actual application starts. Right now it's a minimal placeholder (`components/pages/main/`); replace it with real content.
- **`app/example/`** (`/example`, `/example/[id]`) is reference code, not a real feature. It exists purely to demonstrate the Desktop/Mobile split + section composition pattern end-to-end (`components/pages/example/list/`, `components/pages/example/detail/`, `hooks/usePostsListLogic.ts`, `hooks/usePostDetailLogic.ts`, `constants/posts.ts`, `types/post.ts`). Once you've internalized the pattern, delete `app/example/` and its supporting files rather than building real features inside it.

## Section-based modularization

Per page-route, sections live in `components/pages/<page-name>/sections/`, one file per logical section, PascalCase, suffixed `Section`:

```
components/pages/<page-name>/sections/
├── HeaderSection.tsx
└── ListSection.tsx
```

`DesktopPage.tsx` / `MobilePage.tsx` compose sections — they don't contain section-level markup themselves.

**Split rule:** default to a single shared section file using responsive Tailwind classes (`md:`, `lg:`) internally. Only split a section into `Desktop<Name>Section.tsx` / `Mobile<Name>Section.tsx` when the two variants have genuinely different DOM structure or composition — a different element hierarchy, different interactive components, or content reordering that can't be expressed by rearranging classes on one JSX tree. If you find yourself reaching for a JS viewport check, or the two versions' JSX no longer resemble each other line-for-line, split. Otherwise, keep one file.

Worked example:

| Section | Shared or split? | Why |
|---|---|---|
| `example/list/sections/HeaderSection.tsx` | Shared | Only spacing/type-scale differs by breakpoint |
| `example/list/sections/PostListSection.tsx` | Shared | Grid column count is the only difference (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) |
| `example/detail/sections/ContentSection.tsx` | Shared | Paragraph list, same structure at all sizes |
| `example/detail/sections/DesktopHeaderSection.tsx` + `MobileHeaderSection.tsx` | Split | Desktop uses a text back-link + breadcrumb-style block; mobile uses a sticky icon app-bar — genuinely different element hierarchy, not just styling |

## Naming conventions

- **Components**: PascalCase files (`HeaderSection.tsx`).
- **Hooks**: camelCase, `use`-prefixed (`usePostsListLogic.ts`), matching the exported hook name.
- **Page-route component folders**: kebab-case matching the route, nested under `components/pages/`, mirroring the route tree (`components/pages/main/`, `components/pages/example/list/`, `components/pages/example/detail/`).
- **No barrel `index.ts` files** anywhere — import directly from the file.
- **Always use the `@/` alias** (`@/components/...`, `@/hooks/...`) — never relative `../../` imports.
- **Split-section files are prefixed** `Desktop`/`Mobile` (not suffixed), to visually match `DesktopPage`/`MobilePage`.

## Shared infra layout

- `components/pages/` — page-route folders (`components/pages/<page-name>/`), one per route; see Desktop/Mobile split above.
- `components/common/` — shared UI primitives (e.g. `Badge.tsx`, `AsyncBoundary`, `DeferredComponent`), domain-agnostic and reusable across pages. lunchtime additions: `LogoMark`, `Chip`, `SelectChip`, `FoodImage`, `EmptyState`.
- `components/layout/` — app chrome shared by every user page: `DesktopTopNav` (tablet+), `MobileTabBar` (mobile). Mounted once in `app/(main)/layout.tsx`, not per page.
- `components/providers/` — `AppProviders` (overlay-kit's `OverlayProvider`), mounted in the root layout. Open modals with `overlay.open(...)` via a helper exported next to the modal (e.g. `openLocationPicker()`).
- Shared client state that several pages read (e.g. the current location) lives in a small external store in `lib/` (`lib/locationStore.ts`) read through `useSyncExternalStore` (`hooks/useCurrentLocation.ts`) — no React context needed, and no setState-in-effect for values read from `localStorage`.
- `components/domain/` — lunchtime components that take domain objects (`Restaurant`, `MenuSummary`, `MenuEvidence`) and are reused across pages: `RestaurantRow`, `RestaurantCard`, `MenuCard`, `MenuEvidenceLine`, `FavoriteButton`. Each maps to a Figma local component (node id noted in the file).
- `components/ui/` — the design-system primitives (Button, Dialog, AlertDialog, Popover, Tooltip, Command palette, Combobox, Modal/ConfirmModal, Notify/toast, Table/SortableTable, icons, etc.), also domain-agnostic. See "Design system" below.
- `hooks/` — flat; page-level hooks (`use<PageName>Logic.ts`) and any future cross-page hooks live together.
- `types/` — one file per domain concept (`types/post.ts`), not per-page.
- `constants/` — one file per domain concept holding actual constant data (`constants/posts.ts`), replacing the reference's pattern of inlining constants inside hooks.
- `lib/` — pure helper functions only, no React (`lib/formatDate.ts`, `lib/utils.ts`'s `cn()` classname merger).

## Design system (`components/ui/`)

`components/ui/` was ported wholesale from an internal Vite/React admin template (shadcn "new-york" style, Radix UI primitives). It brought its own dependencies (`@radix-ui/*`, `cmdk`, `@dnd-kit/*`, `react-toastify`, `react-focus-lock`, `overlay-kit`, `react-error-boundary`, `tw-animate-css`) and its own design tokens, all defined in `app/globals.css` under `@theme`/`:root`:

- A custom color palette (`primary-main-blue`, `gray-100`–`800`, etc.) and a compound font-size scale (`text-font-16-500`, meaning 16px/weight 500 in one utility class) — both ported as-is from the source admin template.
- A custom `z-*` scale (`z-modal`, `z-dialog`, `z-popover`, ...) — defined as `--z-index-*` in `@theme` (Tailwind v4 only generates named z-index utilities from that namespace; the template originally used `--z-*`, which silently produced no classes) — and a few named box-shadows (`shadow-pop-over`, `shadow-notify-success`, ...).
- shadcn-standard neutral tokens (`background`, `foreground`, `popover`, `border`, `muted`, `accent`, `primary`, `ring`, each with a `-foreground` pair) that the Radix-based components (`dialog.tsx`, `popover.tsx`, `command.tsx`, `table.tsx`, ...) are built on.

`components.json` is present so the shadcn CLI can add more primitives later (`npx shadcn add <name>` — set `aliases.ui` to `@/components/ui`).

**Known gap:** `components/ui/*`'s own custom palette (`primary-main-blue`, `gray-*`, etc.) is static and does not react to dark mode — it wasn't designed with theming in mind in the source template. Only the shadcn neutral tokens (`background`/`foreground`/`popover`/`border`/`muted`/`accent`) are dark-mode aware. Keep this in mind if you restyle these components.

## Theming and dark mode

**lunchtime v1 is light-only.** The Figma design has no dark theme, so the template's `@media (prefers-color-scheme: dark)` override was removed from `app/globals.css` and `:root` sets `color-scheme: light`. When a dark design exists, restore a dark block that overrides the same variables (including the lunchtime tokens below).

lunchtime design tokens live in `app/globals.css` with the same names as the Figma variables (`Brand/Primary` → `--brand-primary` → `bg-brand-primary`; `Labels/Secondary` → `text-labels-secondary`; `Surface/Placeholder` → `bg-surface-placeholder`). iOS text styles are utilities: `text-title-1` … `text-caption-2` (add `font-semibold`/`font-bold` for Emphasized). New iOS text style names must also be registered in `lib/utils.ts` (`IOS_TEXT_STYLES`) or `cn()` will treat them as colors and drop one of the two classes. Icons use `lucide-react` in place of SF Symbols.

(Template note, kept for reference:) The template originally made dark mode automatic via the `prefers-color-scheme: dark` media query (no manual toggle, no `next-themes`, no `.dark` class).

**Always style with the semantic tokens, never hardcoded Tailwind grays**, or the element won't react to theme changes:

| Use | Not |
|---|---|
| `bg-background` | `bg-white` |
| `text-foreground` | `text-black`, `text-zinc-900` |
| `text-muted-foreground` | `text-zinc-500`, `text-gray-400` |
| `border-border` | `border-zinc-200` |
| `bg-popover` / `text-popover-foreground` | `bg-white` / `text-black` |

This bit us once already: `components/pages/example/**` was originally written with hardcoded `text-zinc-*`/`border-zinc-*` classes, so its background/borders followed dark mode (they used tokens) but its text didn't (it didn't) — now fixed to use the tokens above. Brand/accent colors that are meant to look the same in both themes (e.g. `indigo-600` link color, `Badge`'s `indigo-50`/`indigo-700`) are a deliberate exception — leave those as static Tailwind colors.

## Note on page-level hooks and `"use client"`

A page-level hook only needs `"use client"` if it uses client-only APIs (`useState`, `useEffect`, browser globals). If it's pure derived-data logic (e.g. `usePostDetailLogic`, which just does an array `find`), it doesn't need the directive itself — it's fine as long as it's only ever called from an already-`"use client"` `page.tsx`. Don't add `"use client"` reflexively to every hook file.
