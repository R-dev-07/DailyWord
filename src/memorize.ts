/**
 * Hide words of a verse for recall practice. The higher the Leitner box, the more is hidden:
 * boxes 0-1 hide about a third of the words, boxes 2-3 about two thirds, and boxes 4+ hide every word.
 * Each hidden word keeps its first letter as a hint, so the result is always the same for the same verse.
 */
export function maskVerse(text: string, box: number) {
  const words = text.split(/\s+/).filter(Boolean);
  let hidden = 0;
  const masked = words.map((word, index) => {
    const letters = word.replace(/[^\p{L}]/gu, '');
    const hide = letters.length >= 2 && (box >= 4 || (box >= 2 ? index % 3 !== 0 : index % 3 === 2));
    if (!hide) return word;
    hidden += 1;
    let seen = false;
    return word.replace(/\p{L}/gu, (letter) => { if (!seen) { seen = true; return letter; } return '_'; });
  }).join(' ');
  return { masked, hidden };
}

export const dueLabel = (due: string, today: string) => {
  if (due <= today) return 'Due today';
  const [ay, am, ad] = today.split('-').map(Number);
  const [by, bm, bd] = due.split('-').map(Number);
  const days = Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
  return days === 1 ? 'Due tomorrow' : `Due in ${days} days`;
};
