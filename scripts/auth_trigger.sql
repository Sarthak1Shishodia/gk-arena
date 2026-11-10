-- Run this in your Supabase SQL Editor to link Auth to Profiles automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, elo_rating)
  values (new.id, split_part(new.email, '@', 1), 1200);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
