# Tabletap Web

Guest QR menu and restaurant dashboard for Tabletap. Next.js 14.
Talks only to `tabletap-backend`; never to the database directly.

## Pages

- `/r/<slug>?t=<table>`: guest menu, cart, cooking note, GST, place order
- `/r/<slug>/order/<id>`: order tracking with UPI pay button (GPay, PhonePe, Paytm)
- `/signup`, `/login`: owner/manager account (email, phone or username + password), then `/onboarding`
- `/reset-password`: where the password-reset email lands
- `/verify-email`: "Check your email": owners who signed up with an email enter the 6-digit code before using the dashboard
- `/dashboard/staff`: add waiters/kitchen/cashiers with a PIN (no account). Turn on "Use this device for staff" on a
  shared tablet: it shows "Who's working?", staff unlock with their PIN, and it locks after 10 minutes idle
- `/onboarding`: restaurant setup (name, menu link, tables, UPI ID)
- `/dashboard/orders`: live kitchen board with sound on new orders
- `/dashboard/menu`: categories, dishes, veg/non-veg, sold-out switch
- `/dashboard/tables`: printable QR sheet, one per table

## Setup

1. Run `tabletap-backend` first (http://localhost:4000).
2. `cp .env.example .env.local` and fill it in.
3. `npm install` then `npm run dev` → http://localhost:3000

Deploy on Vercel. Add your Vercel domain to the backend's `CORS_ORIGINS`.

## Notes

- `src/contract/` is shared with backend and app. Change it in the backend first, then copy it here (see `docs/BRANCHING.md`).
- Only `src/lib/auth.ts` (login) and `src/lib/feed.ts` (live updates) know about Supabase.
