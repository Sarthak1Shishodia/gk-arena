-- The app reads audio_tasks and audio_questions with the public anon key.
-- Rows inserted in the SQL editor stay invisible until a select policy exists.

alter table public.audio_tasks enable row level security;

drop policy if exists "Anyone can read listening briefings" on public.audio_tasks;

create policy "Anyone can read listening briefings"
on public.audio_tasks
for select
to anon, authenticated
using (true);

alter table public.audio_questions enable row level security;

drop policy if exists "Anyone can read listening questions" on public.audio_questions;

create policy "Anyone can read listening questions"
on public.audio_questions
for select
to anon, authenticated
using (true);
