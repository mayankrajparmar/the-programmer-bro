import { useId } from "react";

/** The design system's dotted backdrop: 24px grid, dots in the border colour. Decorative only. */
export function DotGrid() {
  const id = `tpb-dots-${useId().replace(/:/g, "")}`;

  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="100%"
      className="pointer-events-none absolute inset-0 block"
    >
      <defs>
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.25" className="fill-border" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
