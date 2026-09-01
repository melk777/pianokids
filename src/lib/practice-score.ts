export function calculatePracticeAccuracy(hits: number, misses: number, wrongNotes: number) {
  const safeHits = Math.max(0, hits);
  const attempts = safeHits + Math.max(0, misses) + Math.max(0, wrongNotes);
  return attempts > 0 ? (safeHits / attempts) * 100 : 100;
}

