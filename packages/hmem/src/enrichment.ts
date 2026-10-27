import { DEFAULTS } from "./types";
import type { MemoryType } from "./types";
import { tokenize } from "./embeddings";

const TECH_TERMS = [
  "react",
  "python",
  "typescript",
  "javascript",
  "rust",
  "sqlite",
  "postgres",
  "indexeddb",
  "node",
  "docker",
  "graphql",
  "redis",
  "webrtc",
  "tauri",
  "electron",
  "llm",
  "ollama",
  "vite",
  "pnpm",
  "npm",
];

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  tech: [
    "code",
    "bug",
    "api",
    "database",
    "deploy",
    "framework",
    "library",
    "server",
    "build",
    "test",
    ...TECH_TERMS,
  ],
  work: ["meeting", "deadline", "client", "project", "sprint", "review", "report", "roadmap"],
  personal: ["family", "hobby", "prefer", "like", "dislike", "morning", "evening"],
};

const STOPWORD_ENTITIES = ["the", "this", "that", "with", "when", "then", "from"];

export function classifyDomain(content: string, tags: string[], type: MemoryType): string {
  for (const tag of tags) {
    if (tag.startsWith("project:")) return tag.slice("project:".length);
    if (tag.startsWith("tech:")) return "tech";
  }
  const tokens = new Set(tokenize(content));
  let bestDomain = "general";
  let bestScore = 0;
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = keywords.reduce((sum, keyword) => sum + (tokens.has(keyword) ? 1 : 0), 0);
    if (domain === "personal" && (type === "personal" || type === "preference")) score += 1;
    if (score > bestScore) {
      bestDomain = domain;
      bestScore = score;
    }
  }
  return bestScore > 0 ? bestDomain : "general";
}

export function namespaceFor(domain: string, type: MemoryType): string {
  const bucket =
    type === "preference" || type === "personal"
      ? "profile"
      : type === "factual"
        ? "facts"
        : "notes";
  return `${domain}/${bucket}`;
}

export function extractEntities(content: string): string[] {
  const entities = new Set<string>();
  for (const token of tokenize(content)) {
    if (TECH_TERMS.includes(token)) entities.add(token);
  }
  for (const match of content.matchAll(/\b([A-Z][a-zA-Z]{2,})\b/g)) {
    const normalized = match[1].toLowerCase();
    if (!STOPWORD_ENTITIES.includes(normalized)) entities.add(normalized);
  }
  return [...entities].slice(0, DEFAULTS.entityCap);
}
