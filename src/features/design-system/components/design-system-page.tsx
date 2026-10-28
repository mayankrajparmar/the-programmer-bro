import { ArrowRight } from "lucide-react";
import { AdSlot } from "@/components/ui/ad-slot";
import { Button, buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardBody,
  CardFooter,
  CardLink,
  CardMeta,
  CardTitle,
  CardType,
} from "@/components/ui/card";
import { CodeBlock, InlineCode } from "@/components/ui/code-block";
import { Tag } from "@/components/ui/tag";

/*
 * Internal page listing every shared component in both themes (use the header's
 * theme switch). For reviewing changes on preview deployments; never in production.
 */

const SAMPLE_CODE = `# Count the tokens in a sentence
from tokenizers import Tokenizer

tokenizer = Tokenizer.from_pretrained("gpt2")
tokens = tokenizer.encode("Your Swiggy order is 5 minutes away")
print(len(tokens.ids), "tokens")  # 8 tokens`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="m-0 font-display text-h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DesignSystemPage() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-12 px-4 py-12 sm:px-6">
      <header className="flex max-w-lesson flex-col gap-3">
        <h1 className="m-0 font-display text-h1 max-sm:text-[30px]/[38px]">Design system</h1>
        <p className="m-0 text-text-muted">
          Every shared component, built from the design tokens. Switch themes with the button in the
          header. This page only exists on local and preview builds.
        </p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Start lesson 1</Button>
          <Button variant="secondary">Read today&apos;s AI news</Button>
          <Button variant="ghost">
            All AI news <ArrowRight aria-hidden className="size-4" />
          </Button>
          <Button disabled>Disabled</Button>
          <a href="#buttons" className={buttonVariants({ variant: "secondary" })}>
            A link styled as a button
          </a>
        </div>
      </Section>

      <Section title="Tags">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="models">Models</Tag>
          <Tag tone="tools">Tools</Tag>
          <Tag tone="research">Research</Tag>
          <Tag tone="policy">Policy</Tag>
          <Tag tone="india">India</Tag>
          <Tag tone="level">Beginner</Tag>
          <Tag>Neutral</Tag>
        </div>
      </Section>

      <Section title="Callouts">
        <div className="flex max-w-lesson flex-col gap-4">
          <Callout kind="note">
            <p>Most English words are one token, but rare words split into several.</p>
          </Callout>
          <Callout kind="tip">
            <p>Paste a paragraph into a tokenizer and count the pieces before reading on.</p>
          </Callout>
          <Callout kind="warn">
            <p>A token is not a word. Pricing and limits count tokens, so long words cost more.</p>
          </Callout>
          <Callout kind="analogy">
            <p>
              Tokens are like UPI transaction IDs: the system works with the numbers, not the names.
            </p>
          </Callout>
        </div>
      </Section>

      <Section title="Code">
        <div className="flex max-w-lesson flex-col gap-4">
          <CodeBlock code={SAMPLE_CODE} lang="python" />
          <CodeBlock
            code={"curl https://theprogrammerbro.in/robots.txt"}
            lang="bash"
            filename="terminal"
          />
          <p className="m-0">
            Inline code looks like <InlineCode>max_tokens: 256</InlineCode> inside a sentence.
          </p>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid max-w-lesson gap-6">
          <Card interactive>
            <CardMeta>
              <Tag tone="models">Models</Tag>
              <time dateTime="2026-10-22">22 Oct 2026</time>
            </CardMeta>
            <CardTitle>An open-source model release adds a longer context window</CardTitle>
            <CardBody>
              A sample news card. Handy for long documents, but more tokens in means more memory and
              slower replies.
            </CardBody>
            <CardFooter>
              <span>Source: Example</span>
              <CardLink
                href="https://example.com/"
                label="Read source: An open-source model release adds a longer context window"
                stretch
              >
                Read source
              </CardLink>
            </CardFooter>
          </Card>
          <Card>
            <CardMeta>
              <CardType>Course</CardType>
              <Tag tone="level">Beginner</Tag>
            </CardMeta>
            <CardTitle>A sample resource card</CardTitle>
            <CardBody>Free course notes that pair well with Track 1, module B.</CardBody>
            <CardFooter>
              <span>Free · 4 hours</span>
              <CardLink href="https://example.com/">Open</CardLink>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <Section title="Ad slot">
        <p className="m-0 max-w-lesson text-text-muted">
          Ads are off until Stage 4, so the slot renders nothing here. When they switch on it holds
          a fixed 280px space.
        </p>
        <AdSlot />
      </Section>
    </div>
  );
}
