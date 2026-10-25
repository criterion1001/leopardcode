import { DEFAULTS, clamp01 } from "./types";
import type { ConflictRecord, MemoryRecord } from "./types";
import { cosine } from "./embeddings";
import type { TrustLedger } from "./ledger";
import { snapshotOf } from "./store";
import type { MemoryStore } from "./store";

const OPPOSING_PAIRS: [RegExp, RegExp][] = [
  [/\balways\b/i, /\bnever\b/i],
  [/\benable[ds]?\b/i, /\bdisable[ds]?\b/i],
  [/\bprefer[s]?\b/i, /\bavoid[s]?|dislike[s]?\b/i],
  [/\bon\b/i, /\boff\b/i],
  [/\byes\b/i, /\bno\b/i],
];

const OPPOSING_SIMILARITY = 0.5;
const NUMERIC_SIMILARITY = 0.8;

export class ConflictDetection {
  private conflicts: ConflictRecord[] = [];
  private seq = 0;

  constructor(
    private store: MemoryStore,
    private ledger: TrustLedger,
    private clock: () => number,
    private actor: string,
  ) {}

  scan(): ConflictRecord[] {
    const found: ConflictRecord[] = [];
    const all = this.store.all();
    for (let first = 0; first < all.length; first++) {
      for (let second = first + 1; second < all.length; second++) {
        const conflict = this.check(all[first], all[second]);
        if (!conflict) continue;
        found.push(conflict);
        this.conflicts.push(conflict);
        this.ledger.log(conflict.memoryA, "conflict_detected", this.actor, {
          details: {
            with: conflict.memoryB,
            reason: conflict.reason,
            confidence: conflict.confidence,
          },
        });
      }
    }
    return found;
  }

  autoResolve(conflict: ConflictRecord): "resolved" | "queued" {
    const first = this.store.get(conflict.memoryA);
    const second = this.store.get(conflict.memoryB);
    if (!first || !second) throw new Error(`H-MEM: unknown conflict members for ${conflict.id}`);

    const firstScore = this.decisionScore(first);
    const secondScore = this.decisionScore(second);
    const margin = Math.abs(firstScore - secondScore) / Math.max(firstScore, secondScore);
    const decisionConfidence = clamp01(conflict.confidence * 0.6 + margin * 0.8);
    if (decisionConfidence < DEFAULTS.conflictAutoResolveGate) return "queued";

    const winner = firstScore >= secondScore ? first : second;
    const loser = firstScore >= secondScore ? second : first;
    const previous = snapshotOf(loser);
    loser.supersededBy = winner.id;
    conflict.resolved = true;
    conflict.resolution = winner.id === conflict.memoryA ? "keep_a" : "keep_b";
    this.ledger.log(loser.id, "conflict_resolved", this.actor, {
      previousState: previous,
      newState: snapshotOf(loser),
      details: {
        conflictId: conflict.id,
        winner: winner.id,
        decisionConfidence: Number(decisionConfidence.toFixed(3)),
      },
    });
    this.store.persist();
    return "resolved";
  }

  queue(): ConflictRecord[] {
    return this.conflicts.filter((conflict) => !conflict.resolved);
  }

  private check(first: MemoryRecord, second: MemoryRecord): ConflictRecord | undefined {
    if (
      first.supersedes === second.id ||
      second.supersedes === first.id ||
      first.supersededBy === second.id ||
      second.supersededBy === first.id
    ) {
      return undefined;
    }

    const similarity = cosine(first.embedding, second.embedding);
    let reason = "";
    let confidence = 0;

    for (const [left, right] of OPPOSING_PAIRS) {
      const opposes =
        (left.test(first.content) && right.test(second.content)) ||
        (right.test(first.content) && left.test(second.content));
      if (opposes && similarity > OPPOSING_SIMILARITY) {
        reason = "opposing phrase pair on similar content";
        confidence = 0.5 + 0.3 * similarity;
      }
    }

    if (!reason && similarity > NUMERIC_SIMILARITY) {
      const numbersA = first.content.match(/\d+(\.\d+)?/g) ?? [];
      const numbersB = second.content.match(/\d+(\.\d+)?/g) ?? [];
      if (numbersA.length > 0 && numbersB.length > 0 && numbersA.join() !== numbersB.join()) {
        reason = "high-similarity conflicting numeric values";
        confidence = 0.55 + 0.25 * similarity;
      }
    }

    if (!reason) return undefined;

    const sharedEntities = first.entities.filter((entity) => second.entities.includes(entity));
    if (sharedEntities.length > 0) confidence += 0.1;
    if (first.domain === second.domain) confidence += 0.05;
    if (first.relatedTo.includes(second.id)) confidence -= 0.1;

    return {
      id: `conflict-${++this.seq}`,
      memoryA: first.id,
      memoryB: second.id,
      reason,
      confidence: clamp01(confidence),
      resolved: false,
    };
  }

  private decisionScore(memory: MemoryRecord): number {
    const recency = memory.lastAccessed / Math.max(1, this.clock());
    const access = Math.min(1, memory.accessCount / 10);
    const richness = Math.min(1, memory.content.length / 200);
    const sourceReliability = memory.provenance.origin === "user_correction" ? 1 : 0.5;
    return (
      0.3 * recency +
      0.2 * access +
      0.25 * memory.confidence +
      0.1 * richness +
      0.15 * sourceReliability
    );
  }
}
