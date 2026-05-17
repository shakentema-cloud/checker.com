
-- ============ ENUMS ============
do $$ begin create type public.game_result as enum ('red','black','draw','ongoing'); exception when duplicate_object then null; end $$;
do $$ begin create type public.game_mode as enum ('vs-ai','vs-human-local','vs-human-online','puzzle','analysis'); exception when duplicate_object then null; end $$;
do $$ begin create type public.move_quality as enum ('brilliant','great','good','inaccuracy','mistake','blunder'); exception when duplicate_object then null; end $$;

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  city text,
  country text,
  country_code text,
  is_pro boolean not null default false,
  elo_blitz integer not null default 1000,
  elo_rapid integer not null default 1000,
  elo_daily integer not null default 1000,
  puzzle_score integer not null default 0,
  rush_best integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  total_games integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles readable by all" on public.profiles;
create policy "profiles readable by all" on public.profiles for select using (true);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'player_' || substr(new.id::text,1,8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ GAMES ============
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  red_player uuid references public.profiles(id) on delete set null,
  black_player uuid references public.profiles(id) on delete set null,
  red_guest_name text,
  black_guest_name text,
  mode public.game_mode not null default 'vs-ai',
  variant text not null default 'standard',
  result public.game_result not null default 'ongoing',
  winner text,
  reason text,
  moves jsonb not null default '[]'::jsonb,
  board_snapshots jsonb not null default '[]'::jsonb,
  accuracy_red numeric,
  accuracy_black numeric,
  duration_seconds integer,
  total_moves integer not null default 0,
  elo_change_red integer,
  elo_change_black integer,
  created_at timestamptz not null default now()
);
alter table public.games enable row level security;
drop policy if exists "games readable by participants or public" on public.games;
create policy "games readable by participants or public" on public.games for select using (
  red_player = auth.uid() or black_player = auth.uid() or red_player is null or black_player is null
);
drop policy if exists "users insert games" on public.games;
create policy "users insert games" on public.games for insert with check (
  auth.uid() is not null and (red_player = auth.uid() or black_player = auth.uid())
);

-- ============ PUZZLES ============
create table if not exists public.puzzles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text not null,
  difficulty text not null default 'medium',
  board jsonb not null,
  side_to_move text not null default 'red',
  solution jsonb not null,
  explanation text,
  is_daily boolean not null default false,
  daily_date date,
  created_at timestamptz not null default now()
);
alter table public.puzzles enable row level security;
drop policy if exists "puzzles readable by all" on public.puzzles;
create policy "puzzles readable by all" on public.puzzles for select using (true);

create table if not exists public.puzzle_attempts (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid references public.puzzles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  solved boolean not null default false,
  time_seconds integer,
  attempts integer not null default 1,
  created_at timestamptz not null default now()
);
alter table public.puzzle_attempts enable row level security;
drop policy if exists "users see own attempts" on public.puzzle_attempts;
create policy "users see own attempts" on public.puzzle_attempts for select using (auth.uid() = user_id);
drop policy if exists "users insert own attempts" on public.puzzle_attempts;
create policy "users insert own attempts" on public.puzzle_attempts for insert with check (auth.uid() = user_id);

-- ============ COACH SESSIONS ============
create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  summary text,
  best_moment text,
  biggest_mistake text,
  key_moments jsonb default '[]'::jsonb,
  training_plan jsonb default '[]'::jsonb,
  messages jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.coach_sessions enable row level security;
drop policy if exists "users see own coach sessions" on public.coach_sessions;
create policy "users see own coach sessions" on public.coach_sessions for select using (auth.uid() = user_id);
drop policy if exists "users insert own coach sessions" on public.coach_sessions;
create policy "users insert own coach sessions" on public.coach_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "users update own coach sessions" on public.coach_sessions;
create policy "users update own coach sessions" on public.coach_sessions for update using (auth.uid() = user_id);

-- ============ LEADERBOARD ============
create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  username text not null,
  city text,
  country text,
  category text not null,
  rating integer not null default 1000,
  score integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  streak integer not null default 0,
  rank_change integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.leaderboard_entries enable row level security;
drop policy if exists "leaderboard public" on public.leaderboard_entries;
create policy "leaderboard public" on public.leaderboard_entries for select using (true);

-- ============ CLUBS ============
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  description text,
  member_count integer not null default 0,
  average_rating integer not null default 1000,
  weekly_games integer not null default 0,
  top_player text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.clubs enable row level security;
drop policy if exists "clubs public" on public.clubs;
create policy "clubs public" on public.clubs for select using (true);
drop policy if exists "users create clubs" on public.clubs;
create policy "users create clubs" on public.clubs for insert with check (auth.uid() = created_by);

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (club_id, user_id)
);
alter table public.club_members enable row level security;
drop policy if exists "club members readable" on public.club_members;
create policy "club members readable" on public.club_members for select using (true);
drop policy if exists "users join clubs" on public.club_members;
create policy "users join clubs" on public.club_members for insert with check (auth.uid() = user_id);
drop policy if exists "users leave clubs" on public.club_members;
create policy "users leave clubs" on public.club_members for delete using (auth.uid() = user_id);

-- ============ USER SETTINGS ============
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  board_theme text not null default 'archive',
  piece_style text not null default 'forest-oxblood',
  show_coordinates boolean not null default true,
  show_legal_moves boolean not null default true,
  sound_enabled boolean not null default true,
  animations_enabled boolean not null default true,
  auto_flip_board boolean not null default false,
  language text not null default 'en',
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
drop policy if exists "settings own select" on public.user_settings;
create policy "settings own select" on public.user_settings for select using (auth.uid() = user_id);
drop policy if exists "settings own upsert" on public.user_settings;
create policy "settings own upsert" on public.user_settings for insert with check (auth.uid() = user_id);
drop policy if exists "settings own update" on public.user_settings;
create policy "settings own update" on public.user_settings for update using (auth.uid() = user_id);

-- ============ ROOMS (Friend matches) ============
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_user_id uuid references public.profiles(id) on delete set null,
  guest_user_id uuid references public.profiles(id) on delete set null,
  host_guest_name text,
  guest_guest_name text,
  status text not null default 'waiting',
  board jsonb,
  current_turn text not null default 'red',
  move_history jsonb not null default '[]'::jsonb,
  chat_messages jsonb not null default '[]'::jsonb,
  time_control text not null default 'rapid-10',
  variant text not null default 'standard',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
drop policy if exists "rooms readable by code" on public.rooms;
create policy "rooms readable by code" on public.rooms for select using (true);
drop policy if exists "anyone can create rooms" on public.rooms;
create policy "anyone can create rooms" on public.rooms for insert with check (true);
drop policy if exists "anyone can update rooms" on public.rooms;
create policy "anyone can update rooms" on public.rooms for update using (true);

alter publication supabase_realtime add table public.rooms;

-- ============ SEEDS ============
-- Clubs
insert into public.clubs (name, city, country, description, member_count, average_rating, weekly_games, top_player) values
('Almaty Checkers Club', 'Almaty', 'Kazakhstan', 'Premier checkers society of southern Kazakhstan. Weekly classical tournaments.', 142, 1480, 87, 'NurbolatK'),
('Astana Strategy Board', 'Astana', 'Kazakhstan', 'Capital city tactical circle. Strong rapid play.', 96, 1520, 64, 'AzaTactical'),
('Kazakhstan Draughts League', 'Almaty', 'Kazakhstan', 'National federation. Hosts the annual Steppe Open.', 312, 1610, 215, 'GMSerikov'),
('Rapid Kings Club', 'Shymkent', 'Kazakhstan', 'Three-minute duels and lightning tournaments every Friday.', 78, 1390, 122, 'BlitzAibek'),
('Student Checkers Arena', 'Almaty', 'Kazakhstan', 'University student circle. Beginner friendly.', 54, 1180, 41, 'DiKhan'),
('Grandmaster Archive Circle', 'Astana', 'Kazakhstan', 'Endgame study and classical archive analysis.', 38, 1720, 19, 'OldMasterT')
on conflict do nothing;

-- Leaderboard entries
insert into public.leaderboard_entries (username, city, country, category, rating, score, wins, losses, draws, streak, rank_change) values
('GMSerikov', 'Almaty', 'Kazakhstan', 'blitz', 1980, 1980, 412, 87, 41, 12, 2),
('AzaTactical', 'Astana', 'Kazakhstan', 'blitz', 1872, 1872, 301, 102, 33, 7, -1),
('NurbolatK', 'Almaty', 'Kazakhstan', 'blitz', 1801, 1801, 254, 96, 28, 5, 1),
('BlitzAibek', 'Shymkent', 'Kazakhstan', 'blitz', 1755, 1755, 188, 71, 19, 3, 0),
('OldMasterT', 'Astana', 'Kazakhstan', 'rapid', 1920, 1920, 188, 41, 33, 9, 3),
('DiKhan', 'Almaty', 'Kazakhstan', 'rapid', 1640, 1640, 102, 71, 22, 2, -2),
('SteppeKnight', 'Karaganda', 'Kazakhstan', 'rapid', 1580, 1580, 88, 64, 18, 4, 1),
('IronDaria', 'Almaty', 'Kazakhstan', 'rapid', 1502, 1502, 73, 58, 12, 0, 0),
('KaspiyRider', 'Aktau', 'Kazakhstan', 'rapid', 1455, 1455, 60, 50, 8, 1, 2),
('GMSerikov', 'Almaty', 'Kazakhstan', 'puzzle', 2840, 2840, 0, 0, 0, 38, 0),
('PuzzleQueen', 'Almaty', 'Kazakhstan', 'puzzle', 2710, 2710, 0, 0, 0, 22, 1),
('TacticianA', 'Astana', 'Kazakhstan', 'puzzle', 2580, 2580, 0, 0, 0, 14, -1),
('BlitzAibek', 'Shymkent', 'Kazakhstan', 'rush', 47, 47, 0, 0, 0, 0, 0),
('GMSerikov', 'Almaty', 'Kazakhstan', 'rush', 62, 62, 0, 0, 0, 0, 2),
('SpeedNurai', 'Almaty', 'Kazakhstan', 'rush', 51, 51, 0, 0, 0, 0, 1),
('AzaTactical', 'Astana', 'Kazakhstan', 'rush', 44, 44, 0, 0, 0, 0, 0),
('SteppeKnight', 'Karaganda', 'Kazakhstan', 'blitz', 1502, 1502, 99, 88, 21, 1, 0),
('IronDaria', 'Almaty', 'Kazakhstan', 'blitz', 1481, 1481, 91, 84, 17, 0, -1),
('KaspiyRider', 'Aktau', 'Kazakhstan', 'blitz', 1440, 1440, 80, 76, 14, 0, 0),
('YoungT', 'Pavlodar', 'Kazakhstan', 'blitz', 1390, 1390, 71, 70, 9, 2, 1)
on conflict do nothing;

-- Puzzles (10 seeded). Boards encoded as 8x8 arrays where each cell is null or {color:'red'|'black',type:'man'|'king'}.
insert into public.puzzles (title, theme, difficulty, board, side_to_move, solution, explanation, is_daily, daily_date) values
('Forced Double', 'double-jump', 'easy',
 '[[null,{"color":"black","type":"man"},null,null,null,null,null,null],[null,null,{"color":"red","type":"man"},null,null,null,null,null],[null,null,null,{"color":"black","type":"man"},null,null,null,null],[null,null,null,null,{"color":"red","type":"man"},null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":1,"col":2},"to":{"row":3,"col":4}}]'::jsonb,
 'Red can chain two jumps. Always scan for landing squares before making a single capture.',
 true, current_date),
('Promotion Race', 'promotion', 'medium',
 '[[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,{"color":"red","type":"man"},null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":5,"col":1},"to":{"row":4,"col":0}}]'::jsonb,
 'Step toward the rim square — the edge protects your runner from being captured.',
 false, null),
('Back Row Break', 'back-row', 'medium',
 '[[null,{"color":"black","type":"man"},null,{"color":"black","type":"man"},null,null,null,null],[null,null,{"color":"red","type":"king"},null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":1,"col":2},"to":{"row":0,"col":3}}]'::jsonb,
 'King takes the inner back-row defender, leaving the second piece isolated.',
 false, null),
('Tempo Squeeze', 'tempo', 'hard',
 '[[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,{"color":"black","type":"king"},null,null,null,null,null],[null,null,null,{"color":"red","type":"king"},null,null,null,null],[null,null,null,null,{"color":"black","type":"man"},null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":4,"col":3},"to":{"row":6,"col":5}}]'::jsonb,
 'Capture the man and your king lands deep with mobility advantage.',
 false, null),
('Forced Capture Trap', 'forced-capture', 'easy',
 '[[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,{"color":"black","type":"man"},null,null,null,null],[null,null,null,null,{"color":"red","type":"man"},null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":3,"col":4},"to":{"row":1,"col":2}}]'::jsonb,
 'Take the offered piece — captures are mandatory in standard rules.',
 false, null),
('King Trap', 'king-trap', 'hard',
 '[[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,{"color":"red","type":"king"},null],[null,null,null,null,null,null,null,{"color":"black","type":"king"}],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":2,"col":6},"to":{"row":4,"col":4}}]'::jsonb,
 'Slide diagonally to control the long diagonal and freeze the opposing king.',
 false, null),
('Two Against One', 'endgame', 'medium',
 '[[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,{"color":"red","type":"king"},null,null,null,null],[null,null,null,null,{"color":"black","type":"king"},null,null,null],[null,null,null,null,null,{"color":"red","type":"king"},null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":3,"col":3},"to":{"row":5,"col":5}}]'::jsonb,
 'Sacrifice opens the diagonal so the second king delivers the decisive blow.',
 false, null),
('Defensive Save', 'defense', 'easy',
 '[[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,{"color":"black","type":"man"},null,null,null,null,null],[null,{"color":"red","type":"man"},null,{"color":"red","type":"man"},null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":5,"col":1},"to":{"row":3,"col":3}}]'::jsonb,
 'Counter-capture removes the attacker before it splits your line.',
 false, null),
('Sacrifice to Promote', 'sacrifice', 'hard',
 '[[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,{"color":"red","type":"man"},null,null,null,null,null,null],[{"color":"black","type":"man"},null,{"color":"black","type":"man"},null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":2,"col":1},"to":{"row":4,"col":3}}]'::jsonb,
 'Jump the central man, land toward the back, and follow up with promotion next turn.',
 false, null),
('Multi-Jump Finish', 'double-jump', 'medium',
 '[[null,null,null,null,null,null,null,null],[null,null,null,{"color":"black","type":"man"},null,{"color":"black","type":"man"},null,null],[null,null,{"color":"red","type":"man"},null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
 'red',
 '[{"from":{"row":2,"col":2},"to":{"row":0,"col":6}}]'::jsonb,
 'Two jumps in sequence land you on the back rank with a fresh king.',
 false, null)
on conflict do nothing;
