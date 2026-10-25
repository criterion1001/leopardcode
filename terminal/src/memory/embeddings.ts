const DIMENSIONS = 128;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function hashToken(token: string): number {
  let hash = 5381;
  for (let index = 0; index < token.length; index++) {
    hash = ((hash << 5) + hash + token.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function embed(text: string): number[] {
  const vector = new Array<number>(DIMENSIONS).fill(0);
  for (const token of tokenize(text)) {
    vector[hashToken(token) % DIMENSIONS] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm === 0 ? vector : vector.map((value) => value / norm);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index++) dot += a[index] * b[index];
  return dot;
}

export function jaccard(a: Iterable<string>, b: Iterable<string>): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const value of setA) if (setB.has(value)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
}
