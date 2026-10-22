-- DODGE PORTAL データベース設定
-- Supabase の「SQL Editor」に全部貼り付けて「Run」を押してください。

create extension if not exists pgcrypto;

-- 大会予定
create table if not exists portal_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prefecture text not null,
  date_start date not null,
  date_end date,
  venue text,
  category text,
  organizer text,
  url text,
  description text,
  poster_name text not null default '名無しさん',
  delete_key_hash text,
  ip_hash text,
  is_verified boolean not null default false,
  is_hidden boolean not null default false,
  report_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists portal_events_date_idx on portal_events (date_start);
create index if not exists portal_events_pref_idx on portal_events (prefecture);

-- D1登録チーム
create table if not exists portal_teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  prefecture text not null,
  city text,
  category text,
  recruiting boolean not null default false,
  website_url text,
  sns_url text,
  description text,
  poster_name text not null default '名無しさん',
  delete_key_hash text,
  ip_hash text,
  is_verified boolean not null default false,
  is_hidden boolean not null default false,
  report_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists portal_teams_pref_idx on portal_teams (prefecture);

-- 交流掲示板（スレッド）
create table if not exists portal_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  prefecture text,
  body text not null,
  poster_name text not null default '名無しさん',
  delete_key_hash text,
  ip_hash text,
  is_hidden boolean not null default false,
  report_count int not null default 0,
  reply_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists portal_threads_activity_idx on portal_threads (last_activity_at desc);

-- 交流掲示板（返信）
create table if not exists portal_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references portal_threads(id) on delete cascade,
  body text not null,
  poster_name text not null default '名無しさん',
  delete_key_hash text,
  ip_hash text,
  is_hidden boolean not null default false,
  report_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists portal_replies_thread_idx on portal_replies (thread_id, created_at);

-- ドッジボールコラム（管理者が発行／寄稿は承認後に公開）
create table if not exists portal_columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  body text not null,
  is_published boolean not null default false,
  is_submission boolean not null default false,
  ip_hash text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- 通報
create table if not exists portal_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  detail text,
  ip_hash text,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- お問い合わせ
create table if not exists portal_contacts (
  id uuid primary key default gen_random_uuid(),
  name text,
  reply_to text,
  subject text not null,
  body text not null,
  ip_hash text,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- 連続投稿の防止用ログ
create table if not exists portal_post_logs (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists portal_post_logs_idx on portal_post_logs (ip_hash, created_at desc);

-- 安全設定：ブラウザから直接データベースを触れないようにする
-- （読み書きはすべてサイトのサーバー経由で行う）
alter table portal_events enable row level security;
alter table portal_teams enable row level security;
alter table portal_threads enable row level security;
alter table portal_replies enable row level security;
alter table portal_columns enable row level security;
alter table portal_reports enable row level security;
alter table portal_contacts enable row level security;
alter table portal_post_logs enable row level security;
