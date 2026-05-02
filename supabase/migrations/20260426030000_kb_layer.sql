-- Layer 2: curated knowledge base for Pulse AI.
-- pgvector + documents + chunks + ingest queue + retrieval RPC.

create extension if not exists vector;

create table if not exists public.kb_documents (
  id uuid primary key default gen_random_uuid(),
  source_url text unique not null,
  title text,
  source_tier text not null check (source_tier in ('tier1_uscis','tier1_dos','tier2_attorney','tier3_community')),
  source_kind text not null check (source_kind in ('policy_manual','visa_bulletin','processing_times','form_instructions','blog','faq')),
  content_hash text,
  fetched_at timestamptz not null default now(),
  effective_date date,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists kb_documents_kind_idx on public.kb_documents (source_kind);
create index if not exists kb_documents_tier_idx on public.kb_documents (source_tier);

create table if not exists public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.kb_documents(id) on delete cascade,
  chunk_idx int not null,
  chunk_text text not null,
  embedding vector(1024),
  token_count int,
  heading_path text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  unique (document_id, chunk_idx)
);
create index if not exists kb_chunks_doc_idx on public.kb_chunks (document_id);
create index if not exists kb_chunks_embedding_idx
  on public.kb_chunks using hnsw (embedding vector_cosine_ops);

create table if not exists public.kb_ingest_queue (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null,
  source_tier text not null,
  url text not null,
  payload jsonb not null default '{}'::jsonb,
  priority int not null default 100,
  status text not null default 'pending' check (status in ('pending','processing','done','failed','skipped')),
  attempts int not null default 0,
  last_error text,
  enqueued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create unique index if not exists kb_ingest_queue_url_kind_idx
  on public.kb_ingest_queue (url, source_kind)
  where status in ('pending','processing');
create index if not exists kb_ingest_queue_status_idx on public.kb_ingest_queue (status, priority, enqueued_at);

create or replace function public.claim_kb_queue_item()
returns public.kb_ingest_queue
language plpgsql
security definer
set search_path = public
as $$
declare
  picked public.kb_ingest_queue;
begin
  with c as (
    select id from public.kb_ingest_queue
    where status = 'pending'
    order by priority asc, enqueued_at asc
    limit 1
    for update skip locked
  )
  update public.kb_ingest_queue q
     set status = 'processing',
         started_at = now(),
         attempts = q.attempts + 1
    from c
   where q.id = c.id
  returning q.* into picked;
  return picked;
end;
$$;

create or replace function public.match_kb_chunks(
  query_embedding vector(1024),
  match_count int default 6,
  tier_filter text[] default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  chunk_text text,
  heading_path text[],
  source_url text,
  title text,
  source_tier text,
  source_kind text,
  effective_date date,
  similarity float
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    c.chunk_text,
    c.heading_path,
    d.source_url,
    d.title,
    d.source_tier,
    d.source_kind,
    d.effective_date,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.kb_chunks c
  join public.kb_documents d on d.id = c.document_id
  where c.embedding is not null
    and (tier_filter is null or d.source_tier = any(tier_filter))
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.kb_documents enable row level security;
alter table public.kb_chunks enable row level security;
alter table public.kb_ingest_queue enable row level security;
