# DailyWord

DailyWord is an offline-first Bible reading app for iOS and Android, built with Expo, React Native, and TypeScript. This starter establishes the core navigation, home experience, reader prototype, local database schema, and appearance controls shown in the supplied design direction.

## Run locally

Install Node.js (LTS), then from this folder run `npm install` followed by `npm start`. The start script uses Expo's tunnel mode so Expo Go can download Metro assets even when the phone cannot reach the computer's local network address. Scan the newly generated QR code; do not reuse an older `192.168.x.x` QR code. Run `npm run typecheck` to check TypeScript. Native notifications and some device features require a development build and physical-device testing.

## Build an installable APK

See `BUILD_APK.md`. Short version: push to GitHub and run the **Build Android APK** workflow (no account needed), or run `npm run build:apk` with an Expo account.

## Current prototype

- No demo data: a fresh install has no streak, no completed practice, no reading history and the reminder is off. Streaks, the week view, today's practice, the "read through the Bible" progress and "continue reading" are all computed from what the user actually does and stored on the device (`src/progress.ts`). The Bible opens at Genesis 1:1.

- Five fixed tabs: Home, Bible, Study, Habits, More.
- Time-aware greeting without a presumed name or hard-coded date.
- Testament, canonical book, chapter, and available-verse selectors; navigation metadata covers all 66 books.
- Read aloud: the whole chapter is queued with the system text-to-speech engine for gapless playback, the current verse is highlighted and scrolled into view, and a player offers previous/next verse, pause/resume, stop and speed. Settings (speed, pitch, per-language voice, continue to next chapter, announce chapter, verse numbers, preview) live in More > Read aloud. iOS pauses natively; Android cannot, so pausing there stops and resuming restarts the current verse.
- Appearance edits are staged and explicitly saved or cancelled; saved settings persist locally and are applied to reading typography and appearance preview.
- About, note editor, saved-item lists, and separate study-feature screens have their own destinations.
- The supplied KJV JSON is bundled offline (66 books, 1,189 chapters, 31,102 verses) and imported into SQLite on first launch. The import verifies totals and per-book chapter counts.
- The in-app Bible versions picker lists all 141 versions in 85 languages. KJV is bundled; every other version downloads on demand from the `thiagobodruk/bible` repository (pinned commit, integrity-checked against `assets/content/bible-manifest.json`), is stored in SQLite for offline reading, and can be removed again. A "Download all versions" action fetches the whole catalog (~704 MB download, ~920 MB on disk). The reader, Bible tab, search, and saved items all follow the selected version.
- The reader uses a focused, theme-aware layout with chapter navigation, dynamic type size, verse selection, notes/bookmarks, and read-aloud.
- Appearance palettes are shared across main app routes; saved theme changes affect root, tabs, reader, search, study, habits, and About screens.
- The JSON has no license or source metadata. KJV territorial distribution rights, especially for the UK Crown letters patent, still require verification before release.
- The modern paraphrase is **not bundled** yet. `src/contentImport.ts` validates future local text packs; paraphrase packs must match the KJV verse references exactly.
- `src/contentImport.ts` validates local text packs; paraphrase packs must have exactly the same verse references as the verified KJV. Source licensing, style-guide approval, and human meaning review remain required.
- No server, account, or analytics. The only network use is the user-initiated download of Bible versions from raw.githubusercontent.com.

## Content and release cautions

The supplied English KJV dataset is now bundled. KJV text is public-domain in the United States but subject to Crown letters patent in the United Kingdom. The JSON has no license/provenance details, so verify the exact source, rights in each distribution territory, and attribution before public release. Versions other than KJV are downloaded by the user's device from the upstream repository rather than bundled, but upstream documentation explicitly reserves rights to the Bible texts, so confirm each edition's terms before a public release. See `assets/content/README.md` and `assets/content/THIRD_PARTY_NOTICES.md`. All reference datasets need independent license review and attribution. Keep the explicit distinction between a paraphrase and a translation from original languages.

Background artwork is built from gradients and shapes; there are no bundled photographs or third-party fonts. Replace or supplement these only with assets whose licenses permit redistribution.

## Next phases

1. Verify licensing and attribution for the bundled KJV source in all intended distribution territories.
2. Approve the paraphrase style guide and glossary, then create and review paraphrase text against every KJV verse. Permission to paraphrase does not complete the editorial review.
3. Complete reading-position persistence, highlights, local reminders, plans, and backup/restore.
4. Test accessibility, performance, notifications, speech, and licensing on real iOS and Android devices before release.

## Customising

- **Artwork:** each theme's header picture is `assets/images/themes/{dark,light,sepia,ocean}.jpg` (about 3:2, 1080x780). Replace a file, keeping its name, to use your own picture for that theme; no code changes are needed. Keep the lower third calm, because it fades into the page.
- **App icon:** `assets/images/icon.png` (full square), `adaptive-icon.png` (artwork inside the central circle, transparent edges) and `splash-icon.png`. The adaptive icon's background colour is set in `app.json`.
- **Topics and quiz questions:** `src/studyContent.ts`. Topics are lists of verse references (the text comes from the reader's chosen Bible version); quiz questions are plain data.

## Notes on features

- **Bible versions:** grouped by language. Downloads run in the background with real progress and can be paused, resumed or cancelled. A paused download is kept only while the app stays open.
- **Reminders:** the permission prompt appears the first time a reminder is switched on (Home or Habits). If notifications were refused twice, Android will not ask again; the app then offers to open system settings. "Send a test notification" on Habits confirms everything works.
- **Study:** Topics (16 themes), Quiz (49 general questions plus verse-based questions built from the installed version), Memorize (spaced repetition: missed verses return sooner, known ones later).
