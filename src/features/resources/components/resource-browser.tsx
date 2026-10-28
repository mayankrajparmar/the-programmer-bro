"use client";

import { ArrowRight, Check, SearchX } from "lucide-react";
import { Fragment, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AdSlot } from "@/components/ui/ad-slot";
import { LEVELS, type Level } from "@/config/levels";
import { delay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { emptyMessage, filterResources } from "../filter";
import { RESOURCE_TYPES, type ResourceType } from "../types";
import type { ResourceView } from "../server/resources";
import { ResourceCard } from "./resource-card";

/** Level and type filter chips over the resource cards. */
export function ResourceBrowser({ resources }: { resources: ResourceView[] }) {
  const [level, setLevel] = useState<Level | null>(null);
  const [type, setType] = useState<ResourceType | null>(null);
  const shown = filterResources(resources, { level, type });

  return (
    <>
      <div className="tpb-in mt-6 flex flex-col gap-3" style={delay(0.16)}>
        <ChipGroup label="Level" options={LEVELS} value={level} onChange={setLevel} />
        <ChipGroup label="Type" options={RESOURCE_TYPES} value={type} onChange={setType} />
      </div>

      <p role="status" className="mt-6 mb-0 text-small text-text-muted">
        {shown.length === resources.length
          ? `${resources.length} resources`
          : `Showing ${shown.length} of ${resources.length} resources`}
      </p>

      {shown.length > 0 ? (
        <ul className="m-0 mt-4 grid list-none gap-6 p-0 md:grid-cols-2">
          {shown.map((resource, index) => (
            <Fragment key={resource.id}>
              <li className="min-w-0">
                <ResourceCard resource={resource} />
              </li>
              {/* Ads go after the third card, once they switch on in Stage 4. */}
              {index === 2 && <AdSlot className="my-0 max-w-none md:col-span-2" />}
            </Fragment>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-12 text-center">
          <span className="tpb-float flex size-11 items-center justify-center rounded-pill bg-surface-raised text-text-muted">
            <SearchX aria-hidden className="size-5" />
          </span>
          <h2 className="m-0 font-display text-title">{emptyMessage({ level, type })}</h2>
          <p className="m-0 text-text-muted">Try another level or type.</p>
          <button
            type="button"
            className={buttonVariants({ variant: "ghost" }, "group")}
            onClick={() => {
              setLevel(null);
              setType(null);
            }}
          >
            Show all resources
            <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
          </button>
        </div>
      )}
    </>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <div role="group" aria-labelledby={id} className="flex flex-wrap items-center gap-2">
      <span id={id} className="w-14 font-display text-label">
        {label}
      </span>
      {[null, ...options].map((option) => {
        const pressed = option === value;
        return (
          <button
            key={option ?? "all"}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option)}
            className={cn(
              buttonVariants({ variant: "secondary" }, "gap-1.5 rounded-pill px-4"),
              pressed && "border-amber bg-amber-subtle hover:border-amber hover:bg-amber-subtle",
            )}
          >
            {pressed && <Check aria-hidden className="size-4" />}
            {option ?? "All"}
          </button>
        );
      })}
    </div>
  );
}
