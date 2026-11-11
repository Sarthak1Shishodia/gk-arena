-- Discussion tables. Existing tables are left untouched.
-- The app reads posts with the author's profiles.username.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  category text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
on public.posts
for select
to anon, authenticated
using (true);

drop policy if exists "Members can create posts" on public.posts;
create policy "Members can create posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
on public.comments
for select
to anon, authenticated
using (true);

drop policy if exists "Members can create comments" on public.comments;
create policy "Members can create comments"
on public.comments
for insert
to authenticated
with check (auth.uid() = user_id);
