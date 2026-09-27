create type public.workspace_role as enum ('owner', 'admin', 'developer', 'viewer');
create type public.project_visibility as enum ('private', 'internal', 'public');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'developer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  visibility public.project_visibility not null default 'private',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);
create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  github_repo_id text,
  github_url text,
  default_branch text not null default 'main',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid()) $$;
create or replace function public.can_manage_workspace(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid() and role in ('owner', 'admin')) $$;

-- Atomic onboarding: the client cannot nominate an owner or create a membership.
create or replace function public.create_workspace(workspace_name text, workspace_slug text)
returns public.workspaces language plpgsql security definer set search_path = public as $$
declare created_workspace public.workspaces;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if workspace_name !~ '^.{2,100}$' or workspace_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid workspace'; end if;
  insert into public.workspaces (name, slug, owner_id) values (trim(workspace_name), workspace_slug, auth.uid()) returning * into created_workspace;
  insert into public.workspace_members (workspace_id, user_id, role) values (created_workspace.id, auth.uid(), 'owner');
  return created_workspace;
end;
$$;

-- Covers users created before the trigger was installed and first OAuth logins.
create or replace function public.ensure_profile()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.profiles (id, name, avatar_url)
  select id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), raw_user_meta_data->>'avatar_url'
  from auth.users where id = auth.uid()
  on conflict (id) do nothing;
end;
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.repositories enable row level security;
create policy "profiles are visible to signed in users" on public.profiles for select to authenticated using (true);
create policy "users update their profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "members view workspaces" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "admins update workspaces" on public.workspaces for update to authenticated using (public.can_manage_workspace(id));
create policy "members view membership" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "admins manage membership" on public.workspace_members for all to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));
create policy "members view projects" on public.projects for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "admins create projects" on public.projects for insert to authenticated with check (created_by = auth.uid() and public.can_manage_workspace(workspace_id));
create policy "admins update projects" on public.projects for update to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));
create policy "admins delete projects" on public.projects for delete to authenticated using (public.can_manage_workspace(workspace_id));
create policy "members view repositories" on public.repositories for select to authenticated using (exists (select 1 from public.projects where projects.id = project_id and public.is_workspace_member(projects.workspace_id)));
create policy "admins manage repositories" on public.repositories for all to authenticated using (exists (select 1 from public.projects where projects.id = project_id and public.can_manage_workspace(projects.workspace_id))) with check (exists (select 1 from public.projects where projects.id = project_id and public.can_manage_workspace(projects.workspace_id)));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, name, avatar_url) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url') on conflict (id) do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
