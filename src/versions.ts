import catalog from '../assets/content/bible-versions-index.json';

export type BibleVersion = { language: string; name: string; abbreviation: string };
type CatalogGroup = { language: string; versions: Array<{ name: string; abbreviation: string }> };

export const bibleVersions: BibleVersion[] = (catalog as CatalogGroup[]).flatMap((group) =>
  group.versions.map((version) => ({
    language: group.language,
    name: version.name,
    abbreviation: version.abbreviation,
  })),
);

/** The King James Version ships inside the app under the legacy id `KJV`; every other version uses its catalog id. */
export const translationIdFor = (abbreviation: string) => (abbreviation === 'en_kjv' ? 'KJV' : abbreviation);

const versionByTranslationId = new Map(bibleVersions.map((version) => [translationIdFor(version.abbreviation), version]));

export const versionForTranslation = (translationId: string) => versionByTranslationId.get(translationId);
export const translationName = (translationId: string) => versionByTranslationId.get(translationId)?.name ?? translationId;
/** Short badge text, e.g. `en_bbe` -> `BBE`. */
export const translationBadge = (translationId: string) => (translationId === 'KJV' ? 'KJV' : translationId.split('_').slice(1).join('_').toUpperCase() || translationId.toUpperCase());
