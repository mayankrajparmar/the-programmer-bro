import { BookOpen, ListChecks, Newspaper, type LucideIcon } from "lucide-react";
import { stagger } from "@/lib/motion";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: BookOpen,
    title: "Read a short lesson (7–10 minutes)",
    body: "One idea at a time, in plain English, with simple diagrams and examples from everyday life in India.",
  },
  {
    icon: ListChecks,
    title: "Take the quiz and see why each answer is right",
    body: "A few quick questions at the end. Right or wrong, every answer comes with a short explanation.",
  },
  {
    icon: Newspaper,
    title: "Stay current with today's AI news",
    body: "Short summaries in our own words, each one linked to its original source.",
  },
];

/** Three steps: read, quiz, keep up. */
export function HowItWorks({ className }: { className?: string }) {
  return (
    <section aria-labelledby="how-title" className={className}>
      <h2 id="how-title" className="tpb-reveal m-0 mb-6 font-display text-h2">
        How it works
      </h2>
      <ol className="m-0 flex list-none flex-wrap gap-6 p-0">
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <li
            key={title}
            className="tpb-reveal flex min-w-0 flex-[1_1_280px] gap-x-4 gap-y-3 border-t border-border pt-6 max-sm:flex-row sm:flex-col"
            style={stagger(index)}
          >
            <span className="flex size-11 flex-none items-center justify-center rounded-md border border-border bg-surface text-text">
              <Icon aria-hidden className="size-5" />
            </span>
            <div className="flex flex-col gap-3">
              <span className="text-small text-text-muted">Step {index + 1}</span>
              <h3 className="m-0 font-display text-title">{title}</h3>
              <p className="m-0 text-text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
