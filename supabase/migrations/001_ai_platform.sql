create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.chat_events (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    mode text not null check (mode in ('professional', 'personal')),
    response_mode text not null,
    latency_ms integer not null default 0 check (latency_ms >= 0),
    sources jsonb not null default '[]'::jsonb,
    topic text not null default 'General',
    prompt_length integer not null default 0 check (prompt_length >= 0),
    prompt_hash text not null,
    prompt_preview text
);

create index if not exists chat_events_created_at_idx
    on public.chat_events (created_at desc);

create index if not exists chat_events_mode_idx
    on public.chat_events (mode);

create index if not exists chat_events_topic_idx
    on public.chat_events (topic);

create table if not exists public.message_feedback (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    chat_event_id uuid not null references public.chat_events (id) on delete cascade,
    rating text not null check (rating in ('positive', 'negative')),
    correction text,
    metadata jsonb not null default '{}'::jsonb
);

create index if not exists message_feedback_chat_event_id_idx
    on public.message_feedback (chat_event_id);

create index if not exists message_feedback_rating_idx
    on public.message_feedback (rating);

create table if not exists public.knowledge_chunks (
    id uuid primary key default gen_random_uuid(),
    source text not null,
    chunk_index integer not null,
    content text not null,
    content_hash text not null,
    token_count integer not null default 0,
    embedding vector(1536),
    updated_at timestamptz not null default now(),
    unique (source, chunk_index)
);

create index if not exists knowledge_chunks_source_idx
    on public.knowledge_chunks (source);

create index if not exists knowledge_chunks_content_hash_idx
    on public.knowledge_chunks (content_hash);

create index if not exists knowledge_chunks_embedding_idx
    on public.knowledge_chunks
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

create table if not exists public.eval_examples (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    question text not null,
    expected_answer text,
    preferred_sources jsonb not null default '[]'::jsonb,
    mode text not null default 'professional' check (mode in ('professional', 'personal')),
    source_feedback_id uuid references public.message_feedback (id) on delete set null
);

create or replace function public.match_knowledge_chunks(
    query_embedding vector(1536),
    match_count integer default 5
)
returns table (
    id uuid,
    source text,
    chunk_index integer,
    content text,
    similarity double precision
)
language sql
stable
as $$
    select
        knowledge_chunks.id,
        knowledge_chunks.source,
        knowledge_chunks.chunk_index,
        knowledge_chunks.content,
        1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
    from public.knowledge_chunks
    where knowledge_chunks.embedding is not null
    order by knowledge_chunks.embedding <=> query_embedding
    limit match_count;
$$;

alter table public.chat_events enable row level security;
alter table public.message_feedback enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.eval_examples enable row level security;
