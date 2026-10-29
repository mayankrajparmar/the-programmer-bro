import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DotGrid } from "@/components/brand/dot-grid";
import { TokenDemo } from "@/components/brand/token-demo";
import { buttonVariants } from "@/components/ui/button";
import { delay } from "@/lib/motion";

const HEADLINE: { word: string; mark?: boolean }[] = [
  { word: "Learn" },
  { word: "how" },
  { word: "AI" },
  { word: "really", mark: true },
  { word: "works" },
];

/** The home page's opening: the promise, two ways in, and the tokenizer demo. */
export function Hero({ start }: { start: { href: string; label: string } }) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <DotGrid />
      <section
        aria-labelledby="hero-title"
        className="relative mx-auto flex max-w-page flex-wrap items-center gap-12 px-4 py-12 sm:px-6 sm:py-18"
      >
        <div className="flex min-w-0 flex-[1_1_480px] flex-col items-start gap-6">
          {/* The display style drops to 36px below 640px wide (design-system note). */}
          <h1
            id="hero-title"
            className="m-0 max-w-[560px] font-display text-display max-sm:text-[36px]/[40px]"
          >
            {HEADLINE.map(({ word, mark }, index) => (
              <span key={word}>
                {index > 0 && " "}
                <span
                  className={mark ? "tpb-word tpb-mark" : "tpb-word"}
                  style={delay(0.1 + index * 0.08)}
                >
                  {word}
                </span>
              </span>
            ))}
          </h1>
          <p className="tpb-in m-0 max-w-[520px]" style={delay(0.55)}>
            Free, bite-sized lessons from the basics to expert level, a quiz after every lesson, and
            the day&apos;s AI news in plain English.
          </p>
          <div className="tpb-in flex w-full flex-wrap gap-3" style={delay(0.7)}>
            <Link
              href={start.href}
              className={buttonVariants({ variant: "primary" }, "group px-5 max-sm:w-full")}
            >
              {start.label}
              <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
            </Link>
            <Link
              href="/news"
              className={buttonVariants({ variant: "secondary" }, "bg-bg px-5 max-sm:w-full")}
            >
              Read today&apos;s AI news
            </Link>
          </div>
        </div>

        <TokenDemo
          caption="One sentence, split into tokens. The split is illustrative: every tokenizer cuts text a little differently."
          className="tpb-in max-w-none min-w-0 flex-[1_1_440px] p-4 sm:max-w-none sm:p-6"
          style={delay(0.3)}
        />
      </section>
    </div>
  );
}
