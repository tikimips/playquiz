-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Quizzes
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  creator_id uuid references auth.users(id) on delete cascade not null,
  cover_color text default '#7c3aed',
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade not null,
  text text not null,
  time_limit integer default 20,
  points integer default 1000,
  order_index integer not null,
  created_at timestamptz default now()
);

-- Answer options
create table options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade not null,
  text text not null,
  is_correct boolean default false,
  order_index integer not null
);

-- Live game sessions
create table games (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) not null,
  host_id uuid references auth.users(id) not null,
  pin varchar(6) unique not null,
  status text default 'lobby' check (status in ('lobby','active','ended')),
  current_question_index integer default -1,
  question_started_at timestamptz,
  created_at timestamptz default now()
);

-- Players (anonymous, join by nickname)
create table players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade not null,
  nickname text not null,
  avatar_color text default '#6366f1',
  score integer default 0,
  created_at timestamptz default now()
);

-- Player answers
create table responses (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade not null,
  question_id uuid references questions(id) not null,
  player_id uuid references players(id) on delete cascade not null,
  option_id uuid references options(id),
  response_time_ms integer,
  points_earned integer default 0,
  is_correct boolean default false,
  created_at timestamptz default now(),
  unique(game_id, question_id, player_id)
);

-- RLS policies
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table games enable row level security;
alter table players enable row level security;
alter table responses enable row level security;

-- Quizzes: owners can do anything, public quizzes readable by all
create policy "owners manage quizzes" on quizzes for all using (auth.uid() = creator_id);
create policy "public quizzes readable" on quizzes for select using (is_public = true);

-- Questions/options: follow quiz ownership
create policy "quiz owner manages questions" on questions for all using (
  exists (select 1 from quizzes where quizzes.id = questions.quiz_id and quizzes.creator_id = auth.uid())
);
create policy "questions readable in active game" on questions for select using (true);

create policy "quiz owner manages options" on options for all using (
  exists (select 1 from questions join quizzes on quizzes.id = questions.quiz_id where questions.id = options.question_id and quizzes.creator_id = auth.uid())
);
create policy "options readable" on options for select using (true);

-- Games: host manages, anyone can read
create policy "host manages game" on games for all using (auth.uid() = host_id);
create policy "anyone can read games" on games for select using (true);

-- Players: anyone can insert/read, only self can update
create policy "anyone can join" on players for insert with check (true);
create policy "anyone can read players" on players for select using (true);
create policy "player updates self" on players for update using (true);

-- Responses: anyone can insert their own, host can read all
create policy "player submits response" on responses for insert with check (true);
create policy "responses readable" on responses for select using (true);
