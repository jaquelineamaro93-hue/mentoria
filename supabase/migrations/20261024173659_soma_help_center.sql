-- Additive help center. No changes to existing users, plans, PDI or contracts.
-- All data access goes through authenticated server routes. Browser roles have
-- no table privileges; RLS is a second deny-by-default boundary.
create table public.soma_help_articles (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check (length(title) between 4 and 140),
 summary text not null check (length(summary) between 10 and 500),
 category text not null check (length(category) between 1 and 80),
 body text not null check (length(body) between 20 and 30000),
 audience text not null default 'all' check (audience in ('all','mentorship','admin','autoconhecimento','diagnostico','percepcao-360','curriculo-ats','linkedin','entrevistas','desenvolvimento','networking','vagas')),
 requires_iris boolean not null default false,
 feature_path text, iris_prompt text,
 status text not null default 'draft' check (status in ('draft','published','archived')),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null,
 check (status <> 'published' or published_at is not null)
);
create table public.soma_help_releases (
 id uuid primary key default gen_random_uuid(),
 article_id uuid not null references public.soma_help_articles(id) on delete restrict,
 title text not null check (length(title) between 4 and 140),
 summary text not null check (length(summary) between 10 and 500),
 kind text not null check (kind in ('new','improvement','guide','notice')),
 notify boolean not null default true,
 archived boolean not null default false,
 published_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null
);
create table public.soma_help_reads (
 user_id uuid not null references auth.users(id) on delete cascade,
 release_id uuid not null references public.soma_help_releases(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key (user_id,release_id)
);
create table public.soma_help_media (
 id uuid primary key default gen_random_uuid(),
 article_id uuid not null references public.soma_help_articles(id) on delete restrict,
 path text not null unique,
 mime text not null check (mime in ('image/png','image/jpeg','image/webp')),
 created_at timestamptz not null default now()
);
create table public.soma_help_revisions (
 id bigint generated always as identity primary key,
 article_id uuid not null references public.soma_help_articles(id) on delete restrict,
 snapshot jsonb not null,
 created_at timestamptz not null default now()
);
create table public.soma_help_access_log (
 id bigint generated always as identity primary key,
 user_id uuid references auth.users(id) on delete set null,
 article_id uuid not null references public.soma_help_articles(id) on delete restrict,
 watermark text not null,
 accessed_at timestamptz not null default now()
);
create index soma_help_releases_date_idx on public.soma_help_releases(published_at desc) where not archived;
create index soma_help_releases_article_idx on public.soma_help_releases(article_id);
create index soma_help_reads_release_idx on public.soma_help_reads(release_id);
create index soma_help_media_article_idx on public.soma_help_media(article_id);
create index soma_help_revisions_article_idx on public.soma_help_revisions(article_id,created_at desc);
create index soma_help_access_log_user_idx on public.soma_help_access_log(user_id);
create index soma_help_access_log_article_idx on public.soma_help_access_log(article_id,accessed_at desc);
alter table public.soma_help_articles enable row level security;
alter table public.soma_help_releases enable row level security;
alter table public.soma_help_reads enable row level security;
alter table public.soma_help_media enable row level security;
alter table public.soma_help_revisions enable row level security;
alter table public.soma_help_access_log enable row level security;
revoke all on public.soma_help_articles,public.soma_help_releases,public.soma_help_reads,public.soma_help_media,public.soma_help_revisions,public.soma_help_access_log from public,anon,authenticated;
grant select,insert,update,delete on public.soma_help_articles,public.soma_help_releases,public.soma_help_reads,public.soma_help_media,public.soma_help_revisions,public.soma_help_access_log to service_role;
revoke all on sequence public.soma_help_revisions_id_seq,public.soma_help_access_log_id_seq from public,anon,authenticated;
grant usage,select on sequence public.soma_help_revisions_id_seq,public.soma_help_access_log_id_seq to service_role;

-- Invoker trigger preserves every revision, including the initial version.
-- No SECURITY DEFINER function or browser-callable write RPC is added.
create function public.soma_help_revision_snapshot() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 insert into public.soma_help_revisions(article_id,snapshot) values(new.id,to_jsonb(new));
 return new;
end;
$$;
revoke all on function public.soma_help_revision_snapshot() from public,anon,authenticated;
grant execute on function public.soma_help_revision_snapshot() to service_role;
create trigger soma_help_revision after insert or update on public.soma_help_articles
 for each row execute function public.soma_help_revision_snapshot();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('soma-help-private','soma-help-private',false,4194304,array['image/png','image/jpeg','image/webp']);
-- No storage.objects policy grants this bucket to browser roles.

-- Editorial content is managed in the authenticated admin interface.
-- Never commit private tutorial bodies or screenshots into the public repository.
