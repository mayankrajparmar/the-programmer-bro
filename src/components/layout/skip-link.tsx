/** First focusable element on every page: jumps keyboard users past the header. */
export function SkipLink({ target = "main" }: { target?: string }) {
  return (
    <a
      href={`#${target}`}
      className="sr-only rounded-md bg-amber px-4 py-3 font-display text-label text-on-amber no-underline hover:text-on-amber focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
    >
      Skip to main content
    </a>
  );
}
