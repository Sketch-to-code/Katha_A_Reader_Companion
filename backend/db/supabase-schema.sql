-- Katha uses its Express API and a server-side Supabase service-role key.
-- Do not put the service-role key in the browser. Supabase Auth is not used
-- for these tables; the API verifies Katha JWTs and applies user ownership.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  email text not null unique,
  password_hash text,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  author text not null default 'Unknown author',
  file_url text not null,
  storage_path text not null,
  page_count integer not null default 1 check (page_count > 0),
  has_native_cover boolean not null default false,
  cover_url text,
  cover_color text,
  last_page_read integer not null default 0 check (last_page_read >= 0),
  last_opened_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_created_idx
  on public.documents (user_id, created_at desc);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  document_id uuid not null references public.documents(id) on delete cascade,
  page integer not null check (page > 0),
  highlighted_text text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_document_created_idx
  on public.notes (user_id, document_id, created_at desc);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  document_id uuid not null references public.documents(id) on delete cascade,
  page integer not null check (page > 0),
  thumbnail_url text,
  created_at timestamptz not null default now(),
  unique (user_id, document_id, page)
);

create index if not exists bookmarks_user_document_created_idx
  on public.bookmarks (user_id, document_id, created_at desc);

create table if not exists public.login_challenges (
  id text primary key,
  email text not null unique,
  name text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.notes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.login_challenges enable row level security;

-- The API is the only data-access path. Keep direct anon/authenticated access
-- disabled even if a future change accidentally adds an RLS policy.
revoke all on table
  public.documents,
  public.notes,
  public.bookmarks,
  public.login_challenges,
  public.users
from public, anon, authenticated;

grant all on table
  public.documents,
  public.notes,
  public.bookmarks,
  public.login_challenges,
  public.users
to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pdf-documents', 'pdf-documents', false, 52428800, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
