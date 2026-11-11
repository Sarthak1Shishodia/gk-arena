-- Theory chapters. Existing tables are left untouched.
-- The app reads subject, order_index, chapter_title, and content.

create table if not exists public.theory_modules (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  order_index integer not null default 0,
  chapter_title text not null,
  content text not null
);

alter table public.theory_modules enable row level security;

drop policy if exists "Anyone can read theory modules" on public.theory_modules;

create policy "Anyone can read theory modules"
on public.theory_modules
for select
to anon, authenticated
using (true);
