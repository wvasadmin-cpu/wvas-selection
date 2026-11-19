# Welland Valley Art Society — Exhibitor Selection

A Next.js (App Router) site for the WVAS committee to judge new exhibitor
applicants remotely. It replaces a hand-built Google Form. Hosted on Netlify
(WVASadmin account). Applicant data is read from Airtable; votes, the committee
name list and resized photos are kept in Netlify Blobs. Nothing is written back
to Airtable. Separate from the stewarding rota (`wellandvalleyrota`).

Design spec: the "WVAS Exhibitor Selection – Design Spec" Claude doc.

## House rules (always follow these)

1. **The repo is public.** Never commit real applicant or committee names,
   emails, photos, API keys, the Airtable base id or the admin allowlist. Test
   data uses made-up names.
2. **Secrets are server-only.** They live in environment variables and are used
   only in `lib/*` server modules and server actions. Files importing
   `server-only` must never be imported by a client component.
3. **Airtable field names live only in `lib/airtable-fields.ts`.** Only the
   fields in `fieldsToRead()` are ever requested — never address, phone or
   email. The application form (`/apply`) writes those, using a separate
   write token (`AIRTABLE_WRITE_TOKEN`); the read token stays read-only.
4. **Applicants are anonymous to voters.** Voting pages show initials only;
   full names and photo file names appear only on the admin pages.
5. **Keep it simple and conventional.** Small, focused files; pure logic in
   `lib/` with Vitest tests; Server Actions for writes, server components for
   reads. Follow the bundled Vercel skills in `.claude/skills/`.

## Project map

- `app/(judging)/` — admin, voting and results pages (judging header).
- `app/apply/` — public exhibitor application form (its own header).
- `app/join/` — public associate membership form; adds to the master members
  table (`AIRTABLE_MEMBERS_TABLE`), never reads it.
- `components/` — UI.
- `lib/` — logic. `artwork.ts` (title/medium split), `initials.ts`,
  `committee.ts`, `tally.ts` are pure and unit-tested.
- `actions/` — server actions (to come).

## Commands

- `npm run dev` — local dev server.
- `npm test` — Vitest unit tests.
- `npx tsc --noEmit` — type-check.

## Environment variables

See `.env.example`. Set on the Netlify site (and `.env.local` locally).
