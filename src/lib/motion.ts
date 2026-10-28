import type { CSSProperties } from "react";

/** Start delay for a design-system entrance animation (tpb-in, tpb-word, tpb-tok, ...). */
export function delay(seconds: number): CSSProperties {
  return { "--d": `${seconds}s` } as CSSProperties;
}
