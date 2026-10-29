-- Stage 1: AI News.
--
-- Three tables: the feeds we read (news_sources), the stories found in them
-- (news_items) and a log of every ingest run (job_runs).
--
-- Security model:
--   * Row Level Security (RLS) is on for every table, so access is denied unless a policy allows it.
--   * The public (anon) role can read approved stories, and only the columns the News page shows.
--   * Everything else, including every write, goes through the service role: the ingest job in
--     GitHub Actions and the admin actions on the server. The service role skips RLS.
--   * "Automatically expose new tables" is off in this project, so each role's access is granted
--     explicitly below.
--
-- Run once: Supabase dashboard > SQL Editor > paste this file > Run.

begin;

create table public.news_sources (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  kind                 text not null check (kind in ('rss', 'arxiv', 'hn')),
  url                  text not null unique,
  -- A hint for the summariser, e.g. 'india' for Indian outlets. The summariser has the final say.
  default_tag          text check (default_tag in ('models', 'tools', 'research', 'policy', 'india')),
  -- General tech feeds only keep stories that mention AI.
  filter_ai            boolean not null default false,
  -- The most stories one run takes from this source.
  max_items            int not null default 5 check (max_items between 1 and 50),
  active               boolean not null default true,
  -- After 5 failed runs in a row the job switches the source off.
  consecutive_failures int not null default 0,
  last_error           text,
  last_fetched_at      timestamptz,
  created_at           timestamptz not null default now()
);

create table public.news_items (
  id                  uuid primary key default gen_random_uuid(),
  source_id           uuid references public.news_sources (id) on delete set null,
  source_name         text not null,
  url                 text not null,
  url_hash            text not null unique, -- sha256 of the normalised URL
  source_title        text not null,        -- the headline as the source wrote it
  title               text not null,        -- our plain-English headline
  summary             text,                 -- null when the summariser failed: write it by hand
  tag                 text check (tag in ('models', 'tools', 'research', 'policy', 'india')),
  status              text not null default 'draft'
                        check (status in ('draft', 'approved', 'rejected')),
  source_published_at timestamptz not null default now(),
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- A story can only go live once it has a summary and a topic.
  constraint news_items_approved_is_complete check (
    status <> 'approved' or (summary is not null and tag is not null and approved_at is not null)
  )
);

create index news_items_feed on public.news_items (status, source_published_at desc);
create index news_items_recent on public.news_items (created_at desc);

create table public.job_runs (
  id            uuid primary key default gen_random_uuid(),
  job           text not null, -- 'news-ingest', later 'weekly-digest'
  status        text not null default 'running'
                  check (status in ('running', 'ok', 'partial', 'failed')),
  items_fetched int not null default 0, -- stories read from all sources
  items_new     int not null default 0, -- left after filtering and removing duplicates
  items_saved   int not null default 0, -- saved as drafts (or rejected, when not about AI)
  errors        jsonb not null default '[]',
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index job_runs_recent on public.job_runs (job, started_at desc);

alter table public.news_sources enable row level security;
alter table public.news_items   enable row level security;
alter table public.job_runs     enable row level security;

-- The public can read approved news and nothing else.
create policy "Anyone can read approved news" on public.news_items
  for select to anon, authenticated
  using (status = 'approved');

grant usage on schema public to anon, authenticated, service_role;

grant select (id, url, title, summary, tag, source_name, source_published_at, approved_at)
  on public.news_items to anon, authenticated;

grant select, insert, update, delete
  on public.news_sources, public.news_items, public.job_runs
  to service_role;

commit;
