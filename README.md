# ExSimplify

**Expenses, simplified.** A PWA to track UAE subscriptions, bills, renewals and car costs in one place — with smart reminders that know a passport needs 6 months' notice and a Mulkiya needs 15 days.

Live: `https://exsimplify.pages.dev` *(update after first deploy)*

## Features

- **Bottom tabs:** Home / Subs / Bills / Renewals / Car
- **Home dashboard:** monthly burn, annual total, AED due this month, 12-month renewal runway, urgent-action list, and cancel candidates (subscriptions ranked by cost)
- **Smart reminders per type:** passport 180d, Ejari 45d, visa / Emirates ID / insurance 30d, car registration 15d, subscriptions 3d — every item can override its own lead time
- **UAE insurance gotcha warning:** flags when car insurance expires before the registration date (you can't pass the car without valid insurance)
- **Google sign-in + Firestore sync**, with a zero-setup local mode (localStorage) until Firebase is configured
- Installable, offline-capable PWA

## Repo structure

```
exsimplify/
├── public/                 ← Cloudflare Pages output directory
│   ├── index.html          App shell
│   ├── manifest.json       PWA install metadata
│   ├── sw.js               Service worker (offline caching)
│   ├── _headers            Cloudflare cache rules (keeps deploys fresh)
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── config.js       ← Firebase config (ONLY file to edit for setup)
│   │   ├── categories.js   ← Expense types, tabs, reminder lead times
│   │   └── app.js          App logic (rendering, storage, reminders)
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── README.md
```

Design intent: **`config.js`** is the only file touched during setup; **`categories.js`** is where you add or tune expense types and reminder windows without going near logic; **`app.js`** is the machinery.

## Deploy on Cloudflare Pages

1. Push this repo to GitHub:
   ```bash
   git init
   git add .
   git commit -m "ExSimplify v2 — initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/exsimplify.git
   git push -u origin main
   ```
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → select the repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **`public`**
4. Deploy. Every future `git push` to `main` auto-deploys.

## Firebase setup (enables sign-in + sync)

1. [Firebase Console](https://console.firebase.google.com) → your project → **Project settings → General → Your apps → Add app → Web (</>)**.
2. Copy the `firebaseConfig` object into `public/js/config.js`.
   - This config is **public by design and safe to commit** — security lives in the Firestore rules below, not in hiding the config.
3. **Authentication → Sign-in method →** enable **Google**.
4. **Authentication → Settings → Authorized domains →** add your Pages domain (e.g. `exsimplify.pages.dev`). *Sign-in silently fails without this.*
5. **Firestore Database → Create database** (production mode; `asia-south1` or `europe-west` are closest to UAE).
6. **Rules tab** → paste and publish:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/items/{itemId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## Install on your phone

- **Android/Chrome:** menu → *Add to Home screen*
- **iPhone:** Share → *Add to Home Screen* — notifications only work from the installed app (iOS 16.4+)

## Known limitations (v2)

- Notifications fire when the app is opened, not in the background — FCM push is the top v3 item
- Car maintenance (oil changes, tyre rotation, services) deliberately deferred: doing it right needs odometer tracking, not just dates
- Advancing a due date by "Renewed ✓ / Paid ✓" clamps month-end correctly (Jan 31 → Feb 28/29) but doesn't yet keep a payment history

## Roadmap

- [ ] **v3:** FCM background push via a scheduled Cloud Function (daily due-date check)
- [ ] Payment history per item (was insurance cheaper last year?)
- [ ] Document attachments — Mulkiya photo, policy PDF (Firebase Storage)
- [ ] Family sharing (shared collection)
- [ ] Car maintenance with odometer tracking
- [ ] Google Play via PWABuilder (TWA); App Store via Capacitor + local notifications
- [ ] Insurance comparison affiliate links at renewal time
