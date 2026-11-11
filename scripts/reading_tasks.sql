-- The app reads reading_tasks with the public anon key.
-- Rows inserted in the SQL editor stay invisible until a select policy exists.

alter table public.reading_tasks enable row level security;

drop policy if exists "Anyone can read reading passages" on public.reading_tasks;

create policy "Anyone can read reading passages"
on public.reading_tasks
for select
to anon, authenticated
using (true);
