import type { CSSProperties } from "react";

/** Start delay for a design-system entrance animation (tpb-in, tpb-word, tpb-tok, ...). */
export function delay(seconds: number): CSSProperties {
  return { "--d": `${seconds}s` } as CSSProperties;
}

/** Position of an element among its siblings, so tpb-reveal staggers them as they scroll in. */
export function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}
