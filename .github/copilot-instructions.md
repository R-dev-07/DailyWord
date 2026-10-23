# DailyWord workspace guidance

- This is an Expo Router, React Native, and TypeScript application; keep platform behavior cross-compatible.
- Use local-first storage. Do not add accounts, analytics, or network services unless requested. The one sanctioned network use is user-initiated Bible version downloads (`src/versionInstaller.ts`).
- Keep the fixed navigation tabs Home, Bible, Study, Habits, and More.
- Verify licenses and attributions before adding scripture datasets, references, photos, or fonts.
- Prefer accessible controls, scalable reading text, and offline-safe assets.
- Run `npm run typecheck` after TypeScript changes.
