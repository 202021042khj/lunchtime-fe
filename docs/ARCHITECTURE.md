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

- **The shared props type is the hook's exported return-type interface** (e.g. `UseMapLogicResult`), imported by both `DesktopPage.tsx` and `MobilePage.tsx`. Never redefine it per file.

Nested routes get their own folder named after the full route, kebab-case: `app/login/email/page.tsx` → `components/pages/login-email/`. Admin routes nest under `components/pages/admin/<route>/` (`app/admin/(console)/menus/page.tsx` → `components/pages/admin/menus/`).

Worked example: `components/pages/map/` + `hooks/useMapLogic.ts`, `components/pages/main/` + `hooks/useHomeLogic.ts`.

## Route groups

- **`app/(main)/`** is a [route group](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — it's omitted from the URL, so `app/(main)/page.tsx` serves `/` (home, `components/pages/main/`). Every user page with the top nav / tab bar lives here (`map`, `search`, `favorites`, `my`, `taste`).
- **`app/admin/(console)/`** groups the admin pages that share the admin sidebar layout; `app/admin/login` sits outside it.
- (The template's `app/example/` reference screens were deleted in stage 1-15.)

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
| `main/sections/TasteBannerSection.tsx` | Shared | Only spacing/type-scale differs by breakpoint |
| `main/sections/MoreMenusSection.tsx` | Shared | Card grid; column count is the only difference |
| `my/sections/SettingsSection.tsx` | Shared | Settings rows, same structure at all sizes |
| `main/sections/DesktopHeroSection.tsx` + `MobileHeroSection.tsx` | Split | Desktop puts the menu name beside the image; mobile overlays it on the image (dark gradient) — genuinely different element hierarchy, not just styling |

## Naming conventions

- **Components**: PascalCase files (`HeaderSection.tsx`).
- **Hooks**: camelCase, `use`-prefixed (`useMapLogic.ts`), matching the exported hook name.
- **Page-route component folders**: kebab-case matching the route, nested under `components/pages/`, mirroring the route tree (`components/pages/main/`, `components/pages/login-email/`, `components/pages/admin/menus/`).
- **No barrel `index.ts` files** anywhere — import directly from the file.
- **Always use the `@/` alias** (`@/components/...`, `@/hooks/...`) — never relative `../../` imports.
- **Split-section files are prefixed** `Desktop`/`Mobile` (not suffixed), to visually match `DesktopPage`/`MobilePage`.

## Shared infra layout

- `components/pages/` — page-route folders (`components/pages/<page-name>/`), one per route; see Desktop/Mobile split above.
- `components/common/` — shared UI primitives (e.g. `AsyncBoundary`, `DeferredComponent`), domain-agnostic and reusable across pages. lunchtime additions: `LogoMark`, `Chip`, `SelectChip`, `FoodImage`, `EmptyState`.
- `components/layout/` — app chrome shared by every user page: `DesktopTopNav` (tablet+), `MobileTabBar` (mobile). Mounted once in `app/(main)/layout.tsx`, not per page.
- `components/providers/` — `AppProviders` (overlay-kit's `OverlayProvider`), mounted in the root layout. Open modals with `overlay.open(...)` via a helper exported next to the modal (e.g. `openLocationPicker()`).
- Shared client state that several pages read (e.g. the current location) lives in a small external store in `lib/` (`lib/locationStore.ts`) read through `useSyncExternalStore` (`hooks/useCurrentLocation.ts`) — no React context needed, and no setState-in-effect for values read from `localStorage`.
- `components/domain/` — lunchtime components that take domain objects (`Restaurant`, `MenuSummary`, `MenuEvidence`) and are reused across pages: `RestaurantRow`, `RestaurantCard`, `MenuCard`, `MenuEvidenceLine`, `FavoriteButton`. Each maps to a Figma local component (node id noted in the file).
- `components/ui/` — the design-system primitives (Button, Dialog, AlertDialog, Popover, Tooltip, Command palette, Combobox, Modal/ConfirmModal, Notify/toast, Table/SortableTable, icons, etc.), also domain-agnostic. See "Design system" below.
- `hooks/` — flat; page-level hooks (`use<PageName>Logic.ts`) and any future cross-page hooks live together.
- `types/` — one file per domain concept (`types/restaurant.ts`, `types/menu.ts`), not per-page.
- `constants/` — one file per domain concept holding actual constant data (`constants/weather.ts`, `constants/review.ts`), replacing the reference's pattern of inlining constants inside hooks.
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

Mixing tokens and hardcoded grays makes one part of an element follow the theme while the rest does not. Brand/accent colors that are meant to look the same in both themes are a deliberate exception — leave those as static Tailwind colors.

## Note on page-level hooks and `"use client"`

A page-level hook only needs `"use client"` if it uses client-only APIs (`useState`, `useEffect`, browser globals). If it's pure derived-data logic (a hook that only derives values from its arguments), it doesn't need the directive itself — it's fine as long as it's only ever called from an already-`"use client"` `page.tsx`. Don't add `"use client"` reflexively to every hook file.

## lunchtime additions (stage 1, 2026-10)

What the app added on top of the template conventions above.

### Pages without the Desktop/Mobile split
- **Admin** (`app/admin/(console)/*`) is desktop-only (plan.md), so each route has a single `components/pages/admin/<route>/<Name>Page.tsx` instead of `DesktopPage` + `MobilePage`. The hook/props rule still applies (`hooks/useAdmin<Name>Logic.ts` → `<Name>Page {...logic}`). Below `lg` the sidebar becomes a top bar and tables scroll horizontally.
- **Standalone screens** without the nav/tab bar (`/login`, `/login/email`, `/signup`, `/password-reset`, `/onboarding`, `/admin/login`) live outside `app/(main)/`. Pages that read `useSearchParams()` (`?next=`, `?step=`, `?q=`) wrap their content in `<Suspense>` inside `page.tsx`.

### Domain component folders
- `components/domain/auth/` — `AuthCard` · `AuthScreen` · `AuthTextField`/`PasswordField` · `EmailCodeStep` · `ChangePasswordDialog` (shared by user login, email account screens and admin login).
- `components/domain/taste/` — taste input fields shared by `/taste` and `/onboarding` (state in `hooks/useTasteForm.ts`).
- `components/domain/admin/` — `AdminWidgets` (page header, stat card, status badge, pagination), `AdminDrawer` (460px right panel) + `DrawerField`, editors (`MenuEditorDrawer`, `SponsoredEditorDrawer`, `SuspendUserDialog`).
- Modals/drawers are opened with a helper exported next to the component (`openWriteReview`, `openLoginRequired`, `askSuspendUser`, `openMenuEditor` …) via overlay-kit. `overlay.openAsync` is used when the caller needs an answer (`confirm`, editors returning the saved value).

### Session stores
- `lib/sessionStore.ts` — user login state (`unknown` → `user` | `guest`), loaded once by `AppProviders` with `GET /me`. `requireLogin(reason)` (`components/domain/LoginRequiredModal.tsx`) opens the login popup before a gated action; a 401 from the server opens the same popup.
- `lib/adminStore.ts` — admin login state + pending-report badge. Completely separate from the user session.
- Both are external stores read through `useSyncExternalStore` (same pattern as `lib/locationStore.ts`). `lib/recentSearches.ts` follows the same pattern so SSR renders an empty list.

### API client
- `request(method, path, { query, body, auth, text, form })` in `lib/api/client.ts`.
  - `auth: "admin"` sends the admin token instead of the user token and never tries the user refresh.
  - `/auth/*` 401s (wrong password) don't trigger a refresh either.
  - `text: true` returns the raw body (CSV); `form` sends multipart.
- Mock mode (default) routes every request to `lib/api/mock/handlers.ts` (user API). Admin routes are merged in from `adminHandlers.ts` (auth · users · reports) and `adminCatalogHandlers.ts` (menus · sponsored), which share helpers in `adminCommon.ts`. Handlers may be async (file reads).
- Contract changes decided on the frontend are written to `API.md` (and logged in `log.md`) — keep them in sync when touching `types/`.

### Debounced URL state
When a debounced input (search) writes to the URL, build the next query string from `window.location.search`, not from the `useSearchParams()` value captured when the timer started — otherwise a filter changed during the debounce window gets overwritten (see `useAdminUsersLogic`, `useAdminMenusLogic`).

### Accessibility notes
- Never nest interactive elements: clickable rows/cards render a real `<button>` for the main area and the favorite button as a **sibling** (`RestaurantRow`, `RestaurantCard`).
- Drawer fields with a single input use `<DrawerField htmlFor>` (a real `<label>`); chip groups use `role="group"` + `aria-label`.
