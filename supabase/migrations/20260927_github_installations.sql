create table public.github_installations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  installation_id bigint not null unique,
  account_id bigint,
  account_login text,
  account_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.github_installation_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique check (char_length(state_hash) = 64),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_github_installation_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger github_installations_set_updated_at
before update on public.github_installations
for each row execute procedure public.set_github_installation_updated_at();

-- Consuming the one-time state in a security-definer function makes replay attempts fail.
create or replace function public.consume_github_installation_state(provided_state_hash text)
returns uuid language plpgsql security definer set search_path = public as $$
declare consumed_workspace_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  delete from public.github_installation_states
  where state_hash = provided_state_hash
    and user_id = auth.uid()
    and expires_at > now()
  returning workspace_id into consumed_workspace_id;

  if consumed_workspace_id is null then raise exception 'Invalid or expired GitHub installation state'; end if;
  if not public.can_manage_workspace(consumed_workspace_id) then raise exception 'Workspace access denied'; end if;
  return consumed_workspace_id;
end;
$$;

revoke all on function public.consume_github_installation_state(text) from public;
grant execute on function public.consume_github_installation_state(text) to authenticated;

alter table public.github_installations enable row level security;
alter table public.github_installation_states enable row level security;

create policy "members view GitHub installations"
on public.github_installations for select to authenticated
using (public.is_workspace_member(workspace_id));

create policy "admins manage GitHub installations"
on public.github_installations for all to authenticated
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

create policy "admins create GitHub installation states"
on public.github_installation_states for insert to authenticated
with check (user_id = auth.uid() and public.can_manage_workspace(workspace_id));
