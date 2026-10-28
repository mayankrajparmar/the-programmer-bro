# The Programmer Bro

Free lessons that take you from the basics of AI to expert level, with quizzes, daily AI news,
resources and a prompt hub. Live at [theprogrammerbro.in](https://theprogrammerbro.in).

**Status:** Stage 1 in progress (the first learning track, quizzes, AI News and Resources).
Production shows the coming-soon page until launch; preview deployments show the full site as it
is built (see [Launch switch](#launch-switch)).

## Tech stack

| Area      | Choice                                                                   |
| --------- | ------------------------------------------------------------------------ |
| Framework | Next.js 16 (App Router, Cache Components) with React 19 and TypeScript   |
| Styling   | Tailwind CSS 4, driven by the design system's tokens                     |
| UI        | Own components in the shadcn/ui style (`cva` variants, `cn()` merging)   |
| Fonts     | Montserrat, Source Sans 3 and JetBrains Mono, self-hosted with next/font |
| Code      | Shiki, highlighting at build time with design-token colours              |
| Icons     | lucide-react                                                             |
| Tests     | Vitest and Testing Library (unit), Playwright with axe (browser)         |
| CI        | GitHub Actions                                                           |
| Hosting   | Vercel (Hobby) for now                                                   |

## Getting started

You need Node.js 22.18 or newer (`nvm use` picks up `.nvmrc`).

```bash
npm ci
npm run dev          # http://localhost:3000
```

Copy `.env.example` to `.env.local` only if you need to override something. Nothing is required
for local development.

## Scripts

| Command                | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Start the dev server                                           |
| `npm run build`        | Production build                                               |
| `npm run start`        | Serve the production build                                     |
| `npm run check`        | Everything CI checks before the build: run it before a PR      |
| `npm run lint`         | ESLint                                                         |
| `npm run typecheck`    | Generate route types, then TypeScript                          |
| `npm run format`       | Prettier (also sorts Tailwind classes)                         |
| `npm test`             | Unit tests (Vitest)                                            |
| `npm run test:e2e`     | Browser tests against the production build (run `build` first) |
| `npm run tokens`       | Regenerate `src/styles/tokens.css` from `design/tokens.json`   |
| `npm run tokens:check` | Fail if the generated CSS is out of date                       |

The first time you run browser tests, install Chromium with `npx playwright install chromium`.

## Project structure

```text
.
├── design/
│   └── tokens.json            # Design tokens exported from the design system (source of truth)
├── e2e/                       # Playwright browser tests
├── public/
│   └── brand/                 # Logo and wordmark SVGs, app icons
├── scripts/
│   ├── build-tokens.ts        # tokens.json → src/styles/tokens.css
│   └── tokens/                # Token rendering and contrast helpers, with tests
├── test/stubs/                # Stand-ins for server-only modules in unit tests
└── src/
    ├── app/                   # Routes only: layouts, pages, metadata files (icons, robots, sitemap)
    │   ├── (site)/            # The full site, inside the header and footer (hidden until launch)
    │   ├── page.tsx           # The coming-soon page
    │   └── not-found.tsx      # The 404 page
    ├── components/
    │   ├── ui/                # Design-system primitives, reused by every feature
    │   ├── layout/            # Site header, footer, navigation, theme switch, skip link
    │   └── brand/             # Logo lockup, dotted backdrop
    ├── config/                # Site facts, navigation, the launch switch, feature switches
    ├── features/              # One folder per product area
    │   ├── coming-soon/
    │   │   ├── components/    # The feature's own components and their tests
    │   │   └── index.ts       # The feature's public surface
    │   ├── design-system/     # Internal preview of every shared component
    │   └── errors/            # 404 page
    ├── lib/                   # Helpers: cn(), theme, motion, code highlighting
    └── styles/                # globals.css, generated tokens.css, self-hosted fonts
```

How code is organised:

- **Routes stay thin.** A file in `src/app` imports a feature and renders it. Data fetching and UI
  live in the feature.
- **Features are modules.** Each product area (learn, quiz, news, resources, ...) gets a folder in
  `src/features` with its own components, hooks, server code and tests. Other code imports it only
  through its `index.ts`; ESLint blocks deep imports such as `@/features/news/components/x`.
- **Shared means used twice.** Code moves to `src/components` or `src/lib` when a second feature
  needs it, not before.
- **Tests sit next to the code** as `*.test.ts(x)`. Browser tests that cover whole pages live in
  `e2e/`.
- Coming in Stage 1, as the plan describes: `src/server/` for data access shared by features,
  `content/` for MDX lessons, `jobs/` for scheduled jobs and `supabase/` for database migrations.

## Design system

Colours, type, spacing and radii come from The Programmer Bro design system. Its tokens are
exported to `design/tokens.json`, and `npm run tokens` turns them into CSS variables for both
themes plus Tailwind utilities:

- Colours: `bg-surface`, `text-text-muted`, `border-border-strong`, `bg-amber`, `text-accent-text`
- Type styles: `text-display`, `text-h1` ... `text-caption`, used with `font-display`,
  `font-body` or `font-mono`
- Radii: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-pill`
- Widths: `max-w-lesson` (720px), `max-w-page` (1200px)

Tailwind's default palette and sizes are switched off, so only design-system values can be used.
Never hard-code a hex colour in a component. Dark is the default theme; `<html data-theme>`
switches all colours at once, and a unit test checks every contrast promise in the token notes.

To change a token, update the design system, export `tokens.json` into `design/`, run
`npm run tokens` and commit both files.

Shared components live in `src/components/ui`: `Button` (and `buttonVariants()` for links styled
as buttons), `Tag`, `Callout`, `CodeBlock` and `InlineCode`, the `Card` parts, `CopyButton` and
`AdSlot`. Open **`/design-system`** on a local or preview build to see them all in both themes.
That page never ships to production.

Brand rules: the PB logo and the "The Programmer Bro" wordmark are amber on both dark and light
backgrounds. Don't recolour, stretch or add effects to them.

## Launch switch

Stage 1 is merged to `main` piece by piece, but the full site stays hidden in production until
launch. `src/config/site-mode.ts` decides:

| Where                                | What visitors see                                         |
| ------------------------------------ | --------------------------------------------------------- |
| Production (`VERCEL_ENV=production`) | The coming-soon page; every other page answers with a 404 |
| Preview deployments and local        | The full site                                             |

`SITE_MODE=live` or `SITE_MODE=coming-soon` overrides the default. **To launch,** set
`SITE_MODE=live` for the Production environment in Vercel and redeploy.

## Deployment

Vercel builds every push. Production is `main`; every other branch gets a preview URL.

- Preview deployments are kept out of search engines automatically (`robots.txt` disallows
  everything and pages are marked `noindex` when `VERCEL_ENV` isn't `production`).
- `NEXT_PUBLIC_SITE_URL` overrides the canonical origin, for a staging site.
- The share image is `src/app/opengraph-image.png` (1200 × 630). Replace the file to change it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branches, commits and pull requests.

## Credits

Fonts are licensed under the SIL Open Font License; see `src/styles/fonts/OFL.txt`.
