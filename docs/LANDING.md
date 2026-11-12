# Tabletap landing page

The `/` route is a marketing page for restaurant owners. Existing account and dashboard routes retain their styling. `landing.css` scopes the visual design to `.landing`; daisyUI components use the `tt-` prefix to avoid collisions with existing controls. Tailwind preflight is intentionally omitted.

Design idea: the kitchen pass. The hero is a steel rail where example kitchen tickets (KOTs) arrive every few seconds and get stamped New, Cooking, Ready (`TicketRail.tsx`; static under reduced motion). Palette: curry-leaf green, thermal-paper white, turmeric for the one primary action, chilli for "New". Type: Archivo (wide) for display and text; IBM Plex Mono only inside tickets and the bill. Features are shown as a printed bill, not cards. The "How it works" QR is real, generated at build time from `NEXT_PUBLIC_APP_URL` + `/demo?table=7`.

## Photography

Downloaded as local JPEG assets from Unsplash:

- `public/images/menu-bowl.jpg`: https://images.unsplash.com/photo-1546069901-ba9599a7e63c

## Verification

Production build: `npm run build -- --webpack` (Webpack avoids the sandbox's restriction on Turbopack CSS compiler IPC).
Browser checks: full demo lifecycle and reset; FAQ expansion; login and signup navigation; no document overflow at 320, 390, 768, 1024 and 1440px; image loading; reduced motion; light landing page under dark OS preference. The landing page works without Supabase configuration; live account and restaurant functions still require the environment variables described in the project README.

## Customer menu photos

Sample dish photos downloaded from Unsplash and served locally:

- `public/images/menu/paneer.jpg`: https://images.unsplash.com/photo-1631452180519-c014fe946bc7
- `public/images/menu/curry.jpg`: https://images.unsplash.com/photo-1603894584373-5ac82b2ae398
- `public/images/menu/coffee.jpg`: https://images.unsplash.com/photo-1461023058943-07fcbe16d735
- `public/images/menu/tea.jpg`: https://images.unsplash.com/photo-1556679343-c7306c1976bc

Menu design is scoped in `src/app/r/[slug]/guest-menu.css`. The daisyUI input/select prefix is `menu-`; the route’s styles do not change the dashboard. The menu follows the existing system dark/light setting. Demo setup tools are collapsed so the guest view remains the focus.
