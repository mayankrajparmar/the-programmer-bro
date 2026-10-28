"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_PROGRESS, readProgress, subscribeToProgress, type Progress } from "./progress-store";

/**
 * This browser's learning progress. Server rendering (and the first client
 * render) sees no progress, so pages prerender the same for everyone; saved
 * progress appears right after hydration.
 */
export function useProgress(): Progress {
  return useSyncExternalStore(subscribeToProgress, readProgress, () => EMPTY_PROGRESS);
}

/** True once the component is hydrated in a browser, so "no progress" really means none. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const noopSubscribe = () => () => {};
