-- Hybrid retrieval: pgvector + Postgres FTS fused via Reciprocal Rank Fusion.
-- Catches exact form numbers / section references that pure vector search blurs.

alter table public.kb_chunks add column if not exists tsv tsvector;

create or replace function public.kb_chunks_tsv_update()
returns trigger
language plpgsql
as $$
begin
  new.tsv :=
    setweight(to_tsvector('english', coalesce(array_to_string(new.heading_path, ' '), '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.chunk_text, '')), 'B');
  return new;
end;
$$;

drop trigger if exists kb_chunks_tsv_trg on public.kb_chunks;
create trigger kb_chunks_tsv_trg
  before insert or update of chunk_text, heading_path
  on public.kb_chunks
  for each row execute function public.kb_chunks_tsv_update();

update public.kb_chunks
   set tsv = setweight(to_tsvector('english', coalesce(array_to_string(heading_path, ' '), '')), 'A') ||
             setweight(to_tsvector('english', coalesce(chunk_text, '')), 'B')
 where tsv is null;

create index if not exists kb_chunks_tsv_idx on public.kb_chunks using gin (tsv);

create or replace function public.match_kb_chunks_hybrid(
  query_text text,
  query_embedding vector(1024),
  match_count int default 6,
  tier_filter text[] default null,
  rrf_k int default 60
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
  vector_similarity float,
  fts_rank float,
  hybrid_score float
)
language sql
stable
as $$
  with vec as (
    select c.id,
           1 - (c.embedding <=> query_embedding) as vector_similarity,
           row_number() over (order by c.embedding <=> query_embedding) as v_rank
      from public.kb_chunks c
      join public.kb_documents d on d.id = c.document_id
     where c.embedding is not null
       and (tier_filter is null or d.source_tier = any(tier_filter))
     order by c.embedding <=> query_embedding
     limit greatest(match_count * 6, 30)
  ),
  fts as (
    select c.id,
           ts_rank_cd(c.tsv, plainto_tsquery('english', query_text)) as fts_rank,
           row_number() over (order by ts_rank_cd(c.tsv, plainto_tsquery('english', query_text)) desc) as f_rank
      from public.kb_chunks c
      join public.kb_documents d on d.id = c.document_id
     where c.tsv @@ plainto_tsquery('english', query_text)
       and (tier_filter is null or d.source_tier = any(tier_filter))
     order by ts_rank_cd(c.tsv, plainto_tsquery('english', query_text)) desc
     limit greatest(match_count * 6, 30)
  ),
  fused as (
    select coalesce(v.id, f.id) as id,
           coalesce(v.vector_similarity, 0) as vector_similarity,
           coalesce(f.fts_rank, 0) as fts_rank,
           coalesce(1.0 / (rrf_k + v.v_rank), 0) + coalesce(1.0 / (rrf_k + f.f_rank), 0) as hybrid_score
      from vec v
      full outer join fts f on f.id = v.id
  )
  select c.id as chunk_id,
         c.document_id,
         c.chunk_text,
         c.heading_path,
         d.source_url,
         d.title,
         d.source_tier,
         d.source_kind,
         d.effective_date,
         fu.vector_similarity::float,
         fu.fts_rank::float,
         fu.hybrid_score::float
    from fused fu
    join public.kb_chunks c on c.id = fu.id
    join public.kb_documents d on d.id = c.document_id
   order by fu.hybrid_score desc
   limit match_count;
$$;
