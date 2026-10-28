import { BrandLockup } from "@/components/brand/brand-lockup";
import { DotGrid } from "@/components/brand/dot-grid";
import { site } from "@/config/site";
import { delay } from "@/lib/motion";
import { FollowLinks } from "./follow-links";
import { TokenDemo } from "./token-demo";

const HEADLINE: { word: string; mark?: boolean }[] = [
  { word: "Learn" },
  { word: "how" },
  { word: "AI" },
  { word: "really", mark: true },
  { word: "works" },
];

/** The Stage 0 landing page, per the "Coming soon" artboards (desktop and phone). */
export function ComingSoonPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg text-text">
      <DotGrid />

      <main className="relative flex flex-auto flex-col items-center justify-center gap-7 px-4 py-12 text-center sm:mx-auto sm:w-full sm:max-w-lesson sm:gap-8 sm:px-6 sm:py-16">
        <BrandLockup className="tpb-in" />

        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {/* The display style drops to 36px below 640px wide (design-system note). */}
          <h1 className="m-0 font-display text-display max-sm:text-[36px]/[40px]">
            {HEADLINE.map(({ word, mark }, i) => (
              <span key={word}>
                {i > 0 && " "}
                <span
                  className={mark ? "tpb-word tpb-mark" : "tpb-word"}
                  style={delay(0.1 + i * 0.08)}
                >
                  {word}
                </span>
              </span>
            ))}
          </h1>
          <p className="tpb-in m-0 max-w-[560px]" style={delay(0.55)}>
            {site.description}
            <span className="tpb-caret" aria-hidden="true" />
          </p>
        </div>

        <TokenDemo className="tpb-in" style={delay(0.7)} />

        <FollowLinks links={site.social} className="tpb-in" style={delay(0.85)} />
      </main>

      <footer className="relative flex-none border-t border-border bg-bg">
        <p className="m-0 px-4 py-4 text-center text-small text-text-muted sm:px-6">
          © 2026 {site.name}
        </p>
      </footer>
    </div>
  );
}
