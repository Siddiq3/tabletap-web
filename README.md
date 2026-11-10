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

## Customer demo

Open `/demo` on the web app to test the restaurant guest experience without Supabase, an account, or the API. The homepage’s **Try the customer menu** link opens it too.

Choose a sample table, add dishes, edit quantities and a cooking note, review GST, and place an order. The demo uses the real guest menu/cart and tracking components with local sample data. The order survives refresh in the same tab when session storage is available. **Order more** starts a new cart; **Reset demo** starts over.

Separate demo controls below tracking simulate Preparing → Ready → Served and cash/UPI confirmation. These controls do not appear for real restaurant orders. No payment app is opened and no restaurant receives an order. This demo does not connect to the separate staff-app sample store or verify backend/payment integration.

## Call staff

Guests with a valid table can use **Call staff** on the menu or tracking page. The button shows confirmation, error/retry feedback and a 30-second cooldown. Staff see pending table requests in the orders dashboard and use **Mark handled** to clear them. Enable call sound from that screen; alerts require the screen to be open. The backend needs migrations 0007 and 0008 first.

To try it without services, open `/demo` and `/demo/staff` in two tabs of the same browser. Tap **Call staff** in the customer tab and watch the staff tab update. Marking the call handled removes it. This local demo uses browser storage, so it does not sync different devices or the Expo app preview. The real feature uses the shared backend and Supabase change events.

### Sounds on both sides

The guest hears a short confirmation chime only after **Call staff** succeeds. Audio is prepared during the tap so mobile browsers can allow playback. Failed requests stay silent. In the staff dashboard and `/demo/staff`, click **Enable call sound** once per visit; this plays a preview and enables the incoming-call chime. **Call sound on · mute** disables it. Repeated updates for the same request do not replay the staff chime. Browser/device volume and autoplay restrictions still apply; visual alerts remain available.

## Restaurant menu UI

The customer menu on `/r/<slug>?t=<table>` and `/demo` includes dish photos with a fallback for missing/broken images, labelled search, category and dietary dropdowns, sorting by price within each category, and collapsible categories. Filters leave cart quantities intact. On desktop, dishes use two columns; on phones, each row puts the photo and quantity control beside the description.

The cart opens as a native modal dialog with focus containment, Escape/back dismissal, a cooking note, GST breakdown, and an empty-cart guard. Checkout disables editing while the order is being sent. Guest staff calls and confirmation sounds are available from the menu header.

The sample menu uses illustrative local photos. Real restaurants display each menu item’s `imageUrl` when provided. Adding sizes, modifiers, or paid extras would require a separate product/API change; the dropdowns here filter existing dishes.

## Owner walkthrough from the beginning

Open `/demo/owner` and use **Restart owner demo** to start over. Follow account creation, the explicitly simulated email-code screen (`123456`), and restaurant setup. The owner preview uses a fixed public password, `tabletap123`; it is not real authentication and never stores a real password or sends email. Use sample profile details only.

In **Menu**, add a category and dish, or load sample dishes; toggle availability to see changes in a guest tab. In **Tables**, choose a table and open its guest menu/QR. Guest orders show under **Orders**, and owner stage/payment changes update the guest tracker. In **Staff**, add, edit, deactivate or reset the PIN of sample staff and test a PIN; these are sample records only and don't unlock anything. **Staff calls** displays the same browser-local assistance requests and sound control. Owner logout/login and page refresh preserve sample progress. The owner/guest demo uses local browser storage, so use two tabs in the same browser; separate devices and the Expo app do not share this sample workspace.

The real `/signup`, verification, onboarding, and dashboard routes continue to require the backend and Supabase configuration. The walkthrough exercises the local demo experience; it does not verify live signup, email delivery, database writes, or payment processing.
