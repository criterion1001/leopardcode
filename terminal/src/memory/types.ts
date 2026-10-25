export type MemoryType = "personal" | "factual" | "preference" | "general";

export type MemoryLayer = "short_term" | "working" | "long_term";

export type ProvenanceOrigin =
  | "chat_message"
  | "user_correction"
  | "file_save"
  | "file_open"
  | "file_edit"
  | "model_response"
  | "plan_completion"
  | "document"
  | "manual"
  | "dream"
  | "sleep_synthesis";

export type FeedbackKind = "helpful" | "not_helpful" | "wrong";

export type MiningEventType =
  | "chat_message"
  | "user_correction"
  | "file_save"
  | "file_open"
  | "file_edit"
  | "model_response"
  | "plan_completion";

export type DreamProposalType = "insight" | "domain" | "invariant";

export type LedgerAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "feedback"
  | "promote"
  | "demote"
  | "merge"
  | "conflict_detected"
  | "conflict_resolved"
  | "sleep_consolidate"
  | "sleep_archive"
  | "sleep_synthesize"
  | "dream_proposed"
  | "dream_approved"
  | "dream_rejected"
  | "restore";

export interface Provenance {
  origin: ProvenanceOrigin;
  learnedAt: number;
  label: string;
  refs?: string[];
}

export interface MemoryRecord {
  id: string;
  content: string;
  type: MemoryType;
  layer: MemoryLayer;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  tags: string[];
  embedding: number[];
  score?: number;
  confidence: number;
  source: string;
  provenance: Provenance;
  chatId?: string;
  missionId?: string;
  goalRunId?: string;
  domain: string;
  namespace: string;
  entities: string[];
  relatedTo: string[];
  supersedes?: string;
  supersededBy?: string;
  derivedFrom?: string[];
}

export interface LedgerEntry {
  memoryId: string;
  action: LedgerAction;
  actor: string;
  timestamp: number;
  previousState?: Partial<MemoryRecord>;
  newState?: Partial<MemoryRecord>;
  details?: Record<string, unknown>;
}

export interface DreamProposal {
  id: string;
  type: DreamProposalType;
  content: string;
  derivedFrom: string[];
  suggestedDomain?: string;
  status: "proposed" | "approved" | "rejected";
}

export interface SleepPreview {
  toConsolidate: string[];
  toArchive: string[];
  toSynthesize: string[][];
}

export interface SleepReport {
  backupId: string;
  consolidated: number;
  archived: number;
  synthesized: number;
  actionLog: string[];
}

export interface ConflictRecord {
  id: string;
  memoryA: string;
  memoryB: string;
  reason: string;
  confidence: number;
  resolved: boolean;
  resolution?: "keep_a" | "keep_b" | "keep_both" | "merge" | "delete_both";
}

export interface RetrievedMemory {
  memory: MemoryRecord;
  relevance: number;
}

export interface QueryResult {
  memories: RetrievedMemory[];
  context: string;
  trace: {
    retrievalReason: string;
    strategy: "minimal" | "personal" | "comprehensive";
    scores: Record<string, number>;
  };
}

export interface HmemOptions {
  clock?: () => number;
  persistDir?: string;
  actor?: string;
  minerFn?: (prompt: string) => Promise<string>;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export const FEEDBACK_DELTAS: Record<FeedbackKind, number> = {
  helpful: 0.05,
  not_helpful: -0.03,
  wrong: -0.2,
};

export const LAYER_WEIGHT: Record<MemoryLayer, number> = {
  long_term: 1.0,
  working: 0.8,
  short_term: 0.6,
};

export const DEFAULTS = {
  retrievalTopN: 5,
  retrievalThreshold: 0.35,
  consolidationDays: 7,
  archiveMinDays: 30,
  archiveMaxAccess: 2,
  synthesisCosine: 0.82,
  dreamClusterMinSize: 2,
  dreamRelatedness: 0.35,
  maxDreamProposalsPerType: 8,
  conflictAutoResolveGate: 0.7,
  entityCap: 10,
  relatedCap: 5,
  recencyDays: 14,
} as const;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
