/*
# Create payment_sessions table

## Purpose
Tracks which Stripe Checkout session IDs have already been redeemed.
This is the anti-replay layer: once a session_id appears in this table the
verify-payment edge function rejects a second use of the same session.

## New Tables
- `payment_sessions`
  - `id`          uuid, primary key, auto-generated
  - `session_id`  text, UNIQUE — the Stripe Checkout Session ID (cs_live_... / cs_test_...)
  - `spread_type` text — which spread was purchased ('three' or 'celtic')
  - `created_at`  timestamptz — timestamp of redemption

## Security
- RLS is enabled.
- No client-facing SELECT/UPDATE/DELETE policies are added: the table is
  written exclusively by the verify-payment edge function running with the
  service-role key, which bypasses RLS entirely.
- Only an INSERT policy for anon + authenticated is omitted intentionally —
  all writes go through the trusted edge function.

## Notes
1. The UNIQUE constraint on `session_id` means a duplicate insert (replay
   attempt) raises error code 23505, which the edge function detects and
   rejects with HTTP 409.
2. This table stores no personal or payment data — only the opaque Stripe
   session identifier and the spread type.
*/

CREATE TABLE IF NOT EXISTS payment_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  text        UNIQUE NOT NULL,
  spread_type text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
