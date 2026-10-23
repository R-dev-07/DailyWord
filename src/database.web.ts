// SQLite is enabled for the native iOS and Android app. This web adapter keeps
// Expo Router's optional web renderer from importing SQLite's WASM worker.
export async function initializeDatabase() { return undefined; }
export async function getInstalledTranslationIds() { return ['KJV']; }
export async function getChapterVerses() { return [] as Array<{ verse: number; text: string }>; }
export async function getBookmarkedVerses() { return [] as Array<{ book_id: number; chapter: number; verse: number }>; }
export async function getChapterHighlights() { return {} as Record<number, string>; }
export async function saveHighlight() {}
export async function removeHighlight() {}
export async function saveBookmark() {}
export async function saveNote() {}
export async function deleteStudyItem() {}
export async function getStudyItems() { return []; }
export async function searchVerses() { return []; }
export async function installTranslationRows() {}
export async function removeTranslation() {}
