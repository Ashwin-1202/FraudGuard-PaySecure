-- Minimal extension of the EXISTING transactions table for banking demo metadata.
alter table public.transactions
  add column if not exists sender_name text,
  add column if not exists sender_account text,
  add column if not exists receiver_user_id bigint,
  add column if not exists receiver_name text,
  add column if not exists receiver_account text,
  add column if not exists payment_status text;

create index if not exists idx_transactions_receiver_user_id
  on public.transactions(receiver_user_id);
