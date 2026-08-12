# Mahd SAS — School Administration System

A React + Vite school management app (admin / teacher / student / parent portals) backed by Firebase (Auth, Firestore, Hosting via Netlify).

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS
- Zustand for state management
- Firebase: Authentication, Cloud Firestore
- Hosted on Netlify

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` from `.env.example` and fill in your Firebase web app config (Firebase Console → Project Settings → Your apps).

## Deploying Firestore Security Rules

The app relies on `firestore.rules` to control who can read/write data (teachers are restricted to their assigned classes, subjects and sexes). **Rules only take effect once they are published to your Firebase project.** If a teacher gets "missing or insufficient permissions" after a code update, the rules were almost certainly not re-deployed.

> **Your Firebase project ID:** `ma-ad-sas` (set in `.env` as `VITE_FIREBASE_PROJECT_ID`). Rules must be published to **this** project.

### Option A — Firebase Console (no CLI)

1. Open [console.firebase.google.com](https://console.firebase.google.com) and select project **`ma-ad-sas`** (top-left project picker).
2. Left sidebar → **Build → Firestore Database → Rules** tab.
3. Replace the whole editor content with the contents of `firestore.rules` in this repo.
4. Click **Publish**.

### Option B — Firebase CLI (recommended for repeated deploys)

First time only:

```bash
npm install -g firebase-tools   # or: npx firebase-tools
firebase login                  # opens a browser to authorize
```

Then, every time you change `firestore.rules`:

```bash
npm run deploy:rules
```

(`npm run deploy:rules` runs `firebase deploy --only firestore:rules` against the project configured in `.firebaserc` / `firebase.json`.)

## Testing Firestore Rules Locally

`tests/firestore.rules.test.js` verifies teacher save permissions against the rules using the Firestore emulator — including the stale-`teacherClasses` fix and the security hardenings (blank subjectId / mismatched class / unassigned sex).

Requirements:

- **Java 11+** (the Firestore emulator is a JVM app): `java -version`
- Node 18+

Run:

```bash
npm run test:rules
```

This boots the emulator (`firebase emulators:exec --only firestore`), loads `firestore.rules`, and runs the tests. No Firebase account or credentials needed — tests use the `demo-mahd-sas` project ID locally.

## Other Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the Vite dev server            |
| `npm run build`    | Production build                     |
| `npm run preview`  | Preview the production build         |
| `npm run lint`     | Run ESLint                           |
| `npm run deploy:rules` | Publish Firestore rules (needs `firebase login`) |
| `npm run test:rules`   | Run Firestore rules tests on the emulator |

---

## Vite Template Notes

This project was created from the `create-vite` React template. Details below.

### React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
