create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null unique,
    full_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid (),
    owner_id uuid not null references public.profiles (id) on delete cascade,
    public_slug text not null unique,
    name text not null,
    api_url text not null default '',
    auth_config jsonb not null default '{"type":"none"}'::jsonb,
    data_path text not null default '',
    config jsonb,
    widgets jsonb not null default '[]'::jsonb,
    layout jsonb not null default '[]'::jsonb,
    theme text not null default 'zinc',
    filters jsonb not null default '[]'::jsonb,
    is_public boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.project_snapshots (
    project_id uuid primary key references public.projects (id) on delete cascade,
    data jsonb not null default '[]'::jsonb,
    row_count integer not null default 0,
    synced_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;

create trigger set_projects_updated_at
before update on public.projects
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_project_snapshots_updated_at on public.project_snapshots;

create trigger set_project_snapshots_updated_at
before update on public.project_snapshots
for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;

alter table public.projects enable row level security;

alter table public.project_snapshots enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for
select to authenticated using (auth.uid () = id);

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own" on public.profiles
for update
    to authenticated using (auth.uid () = id)
with
    check (auth.uid () = id);

drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_insert_own" on public.profiles for insert to authenticated
with
    check (auth.uid () = id);

drop policy if exists "projects_select_own" on public.projects;

create policy "projects_select_own" on public.projects for
select to authenticated using (auth.uid () = owner_id);

drop policy if exists "projects_insert_own" on public.projects;

create policy "projects_insert_own" on public.projects for insert to authenticated
with
    check (auth.uid () = owner_id);

drop policy if exists "projects_update_own" on public.projects;

create policy "projects_update_own" on public.projects
for update
    to authenticated using (auth.uid () = owner_id)
with
    check (auth.uid () = owner_id);

drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_delete_own" on public.projects for delete to authenticated using (auth.uid () = owner_id);

drop policy if exists "snapshots_select_own" on public.project_snapshots;

create policy "snapshots_select_own" on public.project_snapshots for
select to authenticated using (
        exists (
            select 1
            from public.projects
            where
                public.projects.id = project_snapshots.project_id
                and public.projects.owner_id = auth.uid ()
        )
    );

drop policy if exists "snapshots_insert_own" on public.project_snapshots;

create policy "snapshots_insert_own" on public.project_snapshots for insert to authenticated
with
    check (
        exists (
            select 1
            from public.projects
            where
                public.projects.id = project_snapshots.project_id
                and public.projects.owner_id = auth.uid ()
        )
    );

drop policy if exists "snapshots_update_own" on public.project_snapshots;

create policy "snapshots_update_own" on public.project_snapshots
for update
    to authenticated using (
        exists (
            select 1
            from public.projects
            where
                public.projects.id = project_snapshots.project_id
                and public.projects.owner_id = auth.uid ()
        )
    )
with
    check (
        exists (
            select 1
            from public.projects
            where
                public.projects.id = project_snapshots.project_id
                and public.projects.owner_id = auth.uid ()
        )
    );

drop policy if exists "snapshots_delete_own" on public.project_snapshots;

create policy "snapshots_delete_own" on public.project_snapshots for delete to authenticated using (
    exists (
        select 1
        from public.projects
        where
            public.projects.id = project_snapshots.project_id
            and public.projects.owner_id = auth.uid ()
    )
);

create or replace function public.get_public_dashboard_by_slug(share_slug text)
returns table (
  id uuid,
  public_slug text,
  name text,
  api_url text,
  widgets jsonb,
  layout jsonb,
  theme text,
  data jsonb,
  row_count integer,
  synced_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    projects.id,
    projects.public_slug,
    projects.name,
    projects.api_url,
    projects.widgets,
    projects.layout,
    projects.theme,
    project_snapshots.data,
    project_snapshots.row_count,
    project_snapshots.synced_at
  from public.projects
  inner join public.project_snapshots
    on project_snapshots.project_id = projects.id
  where projects.public_slug = share_slug
    and projects.is_public = true
  limit 1;
$$;

grant
execute on function public.get_public_dashboard_by_slug (text) to anon,
authenticated;