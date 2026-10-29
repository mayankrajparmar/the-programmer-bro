import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

/*
 * Applies every migration to an in-memory Postgres (PGlite) with Supabase's API roles,
 * then checks what each role can and can't do. The service role skips RLS, as on Supabase.
 */

const dir = new URL("./migrations/", import.meta.url);
const db = new PGlite();

async function as<T>(role: "anon" | "service_role", run: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  try {
    return await run();
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
  `);
  for (const file of readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(new URL(file, dir), "utf8"));
  }
  await as("service_role", () =>
    db.exec(`
      insert into news_items (source_name, url, url_hash, source_title, title, summary, tag, status, approved_at)
      values
        ('Lab blog', 'https://example.com/live', 'live', 'Live', 'Live', 'A summary.', 'models', 'approved', now()),
        ('Lab blog', 'https://example.com/draft', 'draft', 'Draft', 'Draft', null, null, 'draft', null),
        ('Lab blog', 'https://example.com/no', 'no', 'No', 'No', null, null, 'rejected', null);
    `),
  );
}, 30_000);

describe("database migrations", () => {
  it("let the public read approved stories only", async () => {
    const { rows } = await as("anon", () =>
      db.query<{ title: string }>("select title, summary, url, tag from news_items"),
    );
    expect(rows.map((row) => row.title)).toEqual(["Live"]);
  });

  it("hide the columns the News page doesn't need", async () => {
    await expect(as("anon", () => db.query("select source_title from news_items"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("keep sources, job runs and every write away from the public", async () => {
    await expect(as("anon", () => db.query("select * from news_sources"))).rejects.toThrow(
      /permission denied/,
    );
    await expect(as("anon", () => db.query("select * from job_runs"))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      as("anon", () => db.query("update news_items set status = 'approved'")),
    ).rejects.toThrow(/permission denied/);
  });

  it("let the service role do the job's and the admin's work", async () => {
    const { rows } = await as("service_role", () =>
      db.query<{ id: string }>(
        "insert into job_runs (job) values ('news-ingest') returning id, status",
      ),
    );
    expect(rows).toHaveLength(1);
  });

  it("refuse to publish a story without a summary and a topic", async () => {
    await expect(
      as("service_role", () =>
        db.query(
          "update news_items set status = 'approved', approved_at = now() where url_hash = 'draft'",
        ),
      ),
    ).rejects.toThrow(/news_items_approved_is_complete/);
  });

  it("refuse a second copy of the same link", async () => {
    await expect(
      as("service_role", () =>
        db.query(
          "insert into news_items (source_name, url, url_hash, source_title, title) values ('x', 'y', 'live', 'z', 'z')",
        ),
      ),
    ).rejects.toThrow(/duplicate key/);
  });
});
