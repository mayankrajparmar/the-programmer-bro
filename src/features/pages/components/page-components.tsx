import { AtSign, ExternalLink, Mail } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { InlineCode } from "@/components/ui/code-block";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/*
 * What the MDX in content/pages can use: Markdown mapped to the design system, plus
 * <Email /> (the contact address as a link) and <ContactOptions /> (every way to reach us).
 */

function Anchor({ href = "", children }: { href?: string; children?: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className="text-accent-text underline underline-offset-[3px] hover:text-text"
    >
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

/** The contact address, as a mailto link. */
export function Email() {
  return <Anchor href={`mailto:${site.contactEmail}`}>{site.contactEmail}</Anchor>;
}

/** A card for each way to reach us: email first, then our social profiles. */
export function ContactOptions() {
  const options = [
    {
      key: "email",
      icon: Mail,
      title: "Email",
      body: "For corrections, questions, ideas and data requests. We reply within a few days.",
      href: `mailto:${site.contactEmail}`,
      action: site.contactEmail,
      external: false,
    },
    ...site.social.map((profile) => ({
      key: profile.label,
      icon: AtSign,
      title: profile.label,
      body: `Follow along, or send us a message on ${profile.label}.`,
      href: profile.href,
      action: `Visit ${profile.label}`,
      external: true,
    })),
  ];
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
      {options.map(({ key, icon: Icon, title, body, href, action, external }, index) => (
        <li key={key} className={cn("min-w-0", index === 0 && "sm:col-span-2")}>
          <Card className="h-full content-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-md border border-border bg-surface-raised">
              <Icon aria-hidden className="size-5" />
            </span>
            <CardTitle as="h2">{title}</CardTitle>
            <CardBody className="text-body">{body}</CardBody>
            <div>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener me" } : {})}
                className={buttonVariants(
                  { variant: index === 0 ? "primary" : "secondary" },
                  cn("group max-w-full px-5", !external && "[overflow-wrap:anywhere]"),
                )}
              >
                {action}
                {external && (
                  <>
                    <span className="sr-only"> (opens in a new tab)</span>
                    <ExternalLink aria-hidden className="size-4" />
                  </>
                )}
              </a>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export const pageComponents: MDXComponents = {
  h2: ({ id, children }) => (
    <h2 id={id} className="scroll-mt-6 font-display text-h2">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="font-display text-h3">{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: Anchor,
  code: ({ children }) => <InlineCode>{children}</InlineCode>,
  ul: ({ children }) => <ul className="tpb-list">{children}</ul>,
  ol: ({ children }) => <ol className="tpb-list list-decimal">{children}</ol>,
  Callout: ({ kind, title, children }) => (
    <Callout kind={kind} title={title}>
      {children}
    </Callout>
  ),
  Email,
  ContactOptions,
};
