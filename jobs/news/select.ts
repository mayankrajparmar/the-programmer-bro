import { isRecent, mentionsAi } from "./filters.ts";
import { TitleIndex } from "./similarity.ts";
import type { Candidate, FetchedItem } from "./types.ts";
import { hashUrl, normaliseUrl } from "./url.ts";

/*
 * Turning everything fetched into the few stories worth summarising, in four pure steps:
 * prefilter → (look up known links in the database) → dedupe → cap.
 * Sources earlier in content/news-sources.json win ties, so a lab's own post beats
 * an outlet's coverage of the same story.
 */

export interface SelectionStats {
  tooOld: number;
  notAboutAi: number;
  badLink: number;
  overSourceLimit: number;
  seenBefore: number;
  sameStory: number;
  overRunLimit: number;
}

export function emptyStats(): SelectionStats {
  return {
    tooOld: 0,
    notAboutAi: 0,
    badLink: 0,
    overSourceLimit: 0,
    seenBefore: 0,
    sameStory: 0,
    overRunLimit: 0,
  };
}

export type Prepared = Omit<Candidate, "key">;

/** Keeps recent, on-topic stories with usable links, at most `maxItems` per source, newest first. */
export function prefilter(
  items: FetchedItem[],
  now: Date,
  stats: SelectionStats = emptyStats(),
): Prepared[] {
  const bySource = new Map<FetchedItem["source"], Prepared[]>();
  for (const item of items) {
    const publishedAt = item.publishedAt ?? now;
    if (!isRecent(publishedAt, now)) {
      stats.tooOld++;
      continue;
    }
    if (item.source.filterAi && !mentionsAi(`${item.title} ${item.snippet}`)) {
      stats.notAboutAi++;
      continue;
    }
    const normalised = normaliseUrl(item.url);
    if (!normalised) {
      stats.badLink++;
      continue;
    }
    const list = bySource.get(item.source) ?? [];
    list.push({ ...item, url: normalised.url, urlHash: hashUrl(normalised.key), publishedAt });
    bySource.set(item.source, list);
  }

  return [...bySource.values()].flatMap((list) => {
    list.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    const limit = list[0]?.source.maxItems ?? 0;
    stats.overSourceLimit += Math.max(0, list.length - limit);
    return list.slice(0, limit);
  });
}

/**
 * Drops stories whose link is already saved, repeats within this run, and stories whose
 * title matches one saved in the last few days (the same news from another outlet).
 */
export function dedupe(
  items: Prepared[],
  {
    knownHashes,
    recentTitles,
    sourceOrder,
  }: { knownHashes: Set<string>; recentTitles: string[]; sourceOrder: string[] },
  stats: SelectionStats = emptyStats(),
): Prepared[] {
  const rank = (item: Prepared) => {
    const index = sourceOrder.indexOf(item.source.name);
    return index === -1 ? sourceOrder.length : index;
  };
  const ordered = [...items].sort(
    (a, b) => rank(a) - rank(b) || b.publishedAt.getTime() - a.publishedAt.getTime(),
  );

  const hashes = new Set(knownHashes);
  const titles = new TitleIndex(recentTitles);
  const kept: Prepared[] = [];
  for (const item of ordered) {
    if (hashes.has(item.urlHash)) {
      stats.seenBefore++;
      continue;
    }
    hashes.add(item.urlHash);
    if (titles.hasSimilar(item.title)) {
      stats.sameStory++;
      continue;
    }
    titles.add(item.title);
    kept.push(item);
  }
  return kept;
}

/**
 * At most `max` stories, taken in turns from each source (newest first within a source)
 * so one busy feed can't fill the run. Stories left over are picked up by the next run.
 */
export function capRun(
  items: Prepared[],
  max: number,
  sourceOrder: string[],
  stats: SelectionStats = emptyStats(),
): Candidate[] {
  const queues = new Map<string, Prepared[]>();
  for (const name of sourceOrder) queues.set(name, []);
  for (const item of items) {
    const queue = queues.get(item.source.name) ?? [];
    queue.push(item);
    queues.set(item.source.name, queue);
  }
  for (const queue of queues.values()) {
    queue.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  const picked: Prepared[] = [];
  while (picked.length < max) {
    let took = false;
    for (const queue of queues.values()) {
      const next = queue.shift();
      if (!next) continue;
      picked.push(next);
      took = true;
      if (picked.length === max) break;
    }
    if (!took) break;
  }
  stats.overRunLimit += items.length - picked.length;
  return picked.map((item, index) => ({ ...item, key: `c${index + 1}` }));
}
