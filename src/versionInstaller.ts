import manifest from '../assets/content/bible-manifest.json';
import { installTranslationRows } from './database';
import { parseUpstreamBible } from './upstreamBible';
import { translationIdFor, versionForTranslation } from './versions';

type ManifestEntry = { verses: number; books: number; bytes: number };
const entries = manifest.versions as Record<string, ManifestEntry>;

/** Files are pinned to one upstream commit so a download always matches the verse counts recorded in the manifest. */
const baseUrl = `https://raw.githubusercontent.com/thiagobodruk/bible/${manifest.commit}/json/`;

export const versionUrl = (abbreviation: string) => `${baseUrl}${abbreviation}.json`;
export const versionSizeBytes = (abbreviation: string) => entries[abbreviation]?.bytes ?? 0;

/** Validate a downloaded file and store it in the local database. Throws (storing nothing) if it is not the expected text. */
export async function installFromRaw(abbreviation: string, raw: string, onSaving?: (done: number, total: number) => void) {
  const expected = entries[abbreviation];
  const version = versionForTranslation(translationIdFor(abbreviation));
  if (!expected || !version) throw new Error(`Unknown Bible version "${abbreviation}".`);
  const rows = parseUpstreamBible(raw);
  if (rows.length !== expected.verses) {
    throw new Error(`${version.name} downloaded with ${rows.length} verses but ${expected.verses} were expected. Please try again.`);
  }
  await installTranslationRows(translationIdFor(abbreviation), version.name, rows, onSaving);
}
