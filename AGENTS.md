<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# The Programmer Bro: notes for coding agents

Read `README.md` (project structure, design system, scripts) and `CONTRIBUTING.md` before changing
code. The rules that matter most:

- **Commits:** author every commit as `Mayank Raj Parmar <mayankrajparmar@gmail.com>`. Never add AI
  co-author trailers, AI session links or AI signing. The repo's local git config is set up this way.
- **Structure:** routes in `src/app` only render a feature. Each product area is a module in
  `src/features/<name>` with a public `index.ts`; import features only through that index.
  Shared primitives go in `src/components/ui`, framework-free helpers in `src/lib`.
- **Design tokens:** use the token utilities (`bg-surface`, `text-text-muted`, `text-h1`,
  `rounded-md`, ...). Never hard-code colours or font sizes. Don't edit `src/styles/tokens.css`;
  it is generated from `design/tokens.json` by `npm run tokens`.
- **Class names:** combine with `cn()` from `@/lib/utils`. If the design system adds a type style or
  radius, add it to `TYPE_STYLES` / `RADII` there (a unit test checks they match).
- **Brand:** the PB logo and wordmark are amber (`public/brand/*-amber.svg`) on dark and light
  backgrounds. Don't redraw, recolour or restyle them.
- **Motion:** use the `tpb-*` animation classes from `src/styles/globals.css` with `delay()` from
  `@/lib/motion`. Animations play once, and reduced motion turns them off.
- **Accessibility:** tap targets at least 44px, visible focus, one `h1` per page, text alternatives
  for diagrams. The browser tests run axe on every page in both themes.
- **Checks:** `npm run check` and `npm run build && npm run test:e2e` must pass.
