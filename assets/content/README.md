# Scripture content

## Bundled: KJV

`en_kjv.json` is the user-supplied English KJV corpus bundled for offline reading. It has 66 books, 1,189 chapters, and 31,102 verses; the app validates those totals and per-book chapter counts as it imports the text into local SQLite. JSON book names are Portuguese, so the app maps book positions to its English canonical book list; chapter and verse order are preserved.

The supplied JSON itself does not contain license/provenance metadata. The KJV text is public domain in the United States, but KJV distribution can be restricted by Crown letters patent in the United Kingdom. Verify the exact file's provenance, attribution, license, and target territory rights before release.

## Downloadable: all 141 versions

`bible-versions-index.json` is the catalog (141 versions, 85 languages) from `thiagobodruk/bible`. `bible-manifest.json` pins the upstream commit and records the expected verse count, book count, and byte size of every version.

The full catalog is ~704 MB of JSON and ~920 MB once installed in SQLite, which is why versions are downloaded on demand instead of bundled. The Bible versions screen downloads a version from `raw.githubusercontent.com` at the pinned commit, validates it, and installs it atomically (nothing is stored if the download or validation fails). Users can also remove a version or download all of them.

`src/upstreamBible.ts` converts the upstream format. It maps each book by its key (two key sets are supported), accepts partial Bibles (the New-Testament-only, Old-Testament-only and 64-book editions), and accepts editions with fewer chapters than the KJV (for example Malachi with 3 chapters in 13 versions, Psalms with 149 in `hy_neb`).

To update the manifest after changing the pinned commit, re-download the files, parse each with `parseUpstreamBible`, and rewrite the `versions` map.

## Import contract for local packs

A future checked-in pack can use the normalized shape `{ "id": "KJV", "name": "King James Version", "kind": "translation", "expectedVerseCount": 31102, "verses": [{ "bookId": 43, "chapter": 1, "verse": 1, "text": "..." }] }`. Book IDs follow canonical order in `src/bible.ts`.

For each paraphrase tone, set `kind` to `paraphrase`, use its own translation ID, and include precisely the same verse-reference keys as the verified KJV pack. The importer enforces this match. Do not label paraphrase as a translation. Add a documented style guide and glossary, then hand-review samples across genres before distributing generated text.
