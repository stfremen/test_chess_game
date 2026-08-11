-- Public, no-auth results table for the chess game's match history and
-- high-score board. Run once via the Supabase SQL Editor (no linked
-- Supabase CLI project for this repo, so this file is the source of truth
-- rather than something `supabase db pull` generated).

create table if not exists public.results (
  id bigint generated always as identity primary key,
  white_name text not null check (char_length(white_name) between 1 and 40),
  black_name text not null check (char_length(black_name) between 1 and 40),
  winner_name text check (winner_name is null or char_length(winner_name) between 1 and 40),
  result text not null check (result in ('white','black','draw')),
  end_reason text not null check (end_reason in (
    'checkmate','stalemate','timeout',
    'insufficient-material','threefold-repetition','fifty-move-rule'
  )),
  time_control text not null,
  move_count integer not null check (move_count >= 0),
  duration_seconds integer not null check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  check ((result = 'draw' and winner_name is null) or (result <> 'draw' and winner_name is not null))
);

alter table public.results enable row level security;

create policy "Public can read results" on public.results
  for select to anon using (true);

create policy "Public can insert results" on public.results
  for insert to anon with check (true);

-- Supabase no longer auto-exposes new public-schema tables to the Data API
-- (change shipped 2026-04-28) — this grant is required, not optional.
grant select, insert on table public.results to anon;
