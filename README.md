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
├── content/
│   ├── learn/<track>/         # track.json (the lesson plan) and NN-slug.mdx lessons
│   ├── quizzes/               # <lesson-slug>.json, one quiz per lesson
│   └── resources.json         # The hand-picked list on /resources
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
    │   ├── errors/            # 404 page
    │   ├── learn/             # Tracks, lessons, quizzes and browser-saved progress
    │   │   ├── components/    # Track and lesson pages, MDX components
    │   │   ├── diagrams/      # Lesson diagrams as React components
    │   │   ├── progress/      # Progress in localStorage (tpb:progress:v1)
    │   │   ├── quiz/          # The end-of-lesson quiz
    │   │   ├── server/        # Reads and validates content/ at build
    │   │   └── schema.ts      # Zod schemas for every content file
    │   └── resources/         # /resources: cards with level and type filters
    ├── lib/                   # Helpers: cn(), theme, motion, code highlighting, MDX
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
  `jobs/` for scheduled jobs and `supabase/` for database migrations.

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

## Writing a lesson

Lessons are MDX files in the repo, so every change is reviewed in a pull request. The plan for
a track lives in `content/learn/<track>/track.json`; a planned lesson shows as "Coming soon"
until its file exists.

1. Create `content/learn/how-ai-works/NN-<slug>.mdx`, where `NN` is the lesson's number in the
   plan (for example `05-tokens.mdx`). Start it with this frontmatter:

   ```yaml
   ---
   description: One sentence for search results, 50 to 160 characters.
   inShort: The one or two sentence summary shown at the top of the lesson.
   lastReviewed: 2026-11-10 # the day a person last checked it for accuracy
   draft: true # drafts show on previews only; set false once reviewed
   sources:
     - title: Source title
       url: https://example.com/
       type: Article # Article, Paper, Docs, Video, Course, GitHub or Book
       note: What the reader gets from it.
   ---
   ```

2. Write the lesson in Markdown, following the lesson template: hook, then `##` sections
   (concept, analogy, example), then try it and key takeaways. These components are available:
   `<Analogy>`, `<TryIt>`, `<Callout kind="note | tip | warn">`, `<Figure caption="…">` and
   `<KeyTakeaways>` with a bullet list inside. Leave a blank line after each opening tag and
   before each closing tag, so the Markdown inside is read as Markdown.
3. Add the quiz to `content/quizzes/<slug>.json`: 5 to 8 questions, four options each, the
   index (0 to 3) of the right answer, an explanation, and at least two `application`
   questions that ask the learner to use the idea on a new case.
4. Run `npm test`. The content tests load every lesson the way the build does, so a mistake
   in a file fails with the file name and the problem. Reading time is worked out for you.

A diagram is a React component in `src/features/learn/diagrams/`, registered in
`src/features/learn/components/mdx-components.tsx`. Draw it with design-token colour classes
(`fill-surface-raised`, `stroke-amber`, ...) so it works in both themes, and give the SVG an
`aria-label` that says what it shows.

## Adding a resource

Add an entry to `content/resources.json` with an `id`, `title`, `https` `url`, `type` (Course,
Video course, Paper, Tool or Book), `level`, `cost`, and a one or two sentence `description` in
our own words. Add `length` only when you know it, and `lesson` (a lesson slug) when the resource
pairs with a lesson. Open the link and check it before adding it. `npm test` validates the file
and checks that every paired lesson exists.

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
