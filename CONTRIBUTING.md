# Contributing

## Branches and pull requests

- `main` is production and is always deployable. Don't push to it directly.
- Work on a short-lived branch named for the stage and the change, for example
  `stage-1/lesson-layout` or `fix/header-overflow`.
- Open a pull request into `main`. CI must pass, and the template's checklist should be ticked.
- Squash-merge, so `main` reads as one commit per change.

## Commits

- Commits are authored as the repository owner: **Mayank Raj Parmar
  &lt;mayankrajparmar@gmail.com&gt;**. That includes commits made with AI tools: no AI author,
  co-author trailers or AI signatures.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`,
  `chore:`, `test:`, `refactor:`, `ci:`, with an optional scope such as `feat(news):`.
- Write the subject in the imperative, under about 70 characters.

## Before you open a pull request

```bash
npm run check                         # tokens, lint, types, format, unit tests
npm run build && npm run test:e2e     # production build and browser tests
```

For visual changes, look at the page on a phone width (390px) and on desktop, in both themes, and
add screenshots to the pull request.

## Where code goes

See "Project structure" in the [README](README.md#project-structure). In short: routes in
`src/app` stay thin, product areas are modules in `src/features`, shared UI goes in
`src/components/ui`, and colours and sizes come only from design tokens.
