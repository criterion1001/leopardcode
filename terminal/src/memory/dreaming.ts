import { DEFAULTS } from "./types";
import type { DreamProposal, DreamProposalType, MemoryRecord } from "./types";
import { cosine, jaccard } from "./embeddings";
import { classifyDomain } from "./enrichment";
import type { TrustLedger } from "./ledger";
import type { MemoryStore } from "./store";

export class Dreaming {
  private proposals = new Map<string, DreamProposal>();
  private seq = 0;

  constructor(
    private store: MemoryStore,
    private ledger: TrustLedger,
    private clock: () => number,
    private actor: string,
  ) {}

  dream(): DreamProposal[] {
    const created: DreamProposal[] = [];
    const propose = (
      type: DreamProposalType,
      content: string,
      derivedFrom: string[],
      suggestedDomain?: string,
    ): void => {
      const proposal: DreamProposal = {
        id: `dream-${++this.seq}`,
        type,
        content,
        derivedFrom,
        suggestedDomain,
        status: "proposed",
      };
      this.proposals.set(proposal.id, proposal);
      created.push(proposal);
      this.ledger.log(proposal.id, "dream_proposed", this.actor, {
        details: { type, derivedFrom },
      });
    };

    let insights = 0;
    for (const cluster of this.clusterMemories()) {
      if (insights >= DEFAULTS.maxDreamProposalsPerType) break;
      const domains = [...new Set(cluster.map((memory) => memory.domain))].join("/");
      const content = `Across ${cluster.length} related memories (${domains}): ${cluster
        .map((memory) => memory.content)
        .join(" + ")}`;
      propose(
        "insight",
        content,
        cluster.map((memory) => memory.id),
      );
      insights++;
    }

    let domainSuggestions = 0;
    for (const memory of this.store.all()) {
      if (domainSuggestions >= DEFAULTS.maxDreamProposalsPerType) break;
      if (memory.domain !== "general") continue;
      const suggested = classifyDomain(memory.content, memory.tags, memory.type);
      if (suggested === "general") continue;
      propose(
        "domain",
        `Reclassify "${memory.content.slice(0, 60)}" as ${suggested}`,
        [memory.id],
        suggested,
      );
      domainSuggestions++;
    }

    let invariants = 0;
    const preferenceSignals = this.store
      .all()
      .filter(
        (memory) =>
          memory.type === "preference" ||
          memory.type === "personal" ||
          memory.tags.includes("event:user_correction"),
      );
    const byDomain = new Map<string, MemoryRecord[]>();
    for (const memory of preferenceSignals) {
      const group = byDomain.get(memory.domain) ?? [];
      group.push(memory);
      byDomain.set(memory.domain, group);
    }
    for (const [domain, group] of byDomain) {
      if (invariants >= DEFAULTS.maxDreamProposalsPerType) break;
      if (group.length < DEFAULTS.dreamClusterMinSize) continue;
      propose(
        "invariant",
        `Stable pattern in ${domain}: ${group.map((memory) => memory.content).join("; ")}`,
        group.map((memory) => memory.id),
      );
      invariants++;
    }

    return created;
  }

  pending(): DreamProposal[] {
    return [...this.proposals.values()].filter((proposal) => proposal.status === "proposed");
  }

  approve(proposalId: string): MemoryRecord | undefined {
    const proposal = this.mustGetPending(proposalId);
    proposal.status = "approved";
    this.ledger.log(proposalId, "dream_approved", this.actor, {
      details: { type: proposal.type },
    });

    if (proposal.type === "domain") {
      if (proposal.suggestedDomain) {
        for (const memoryId of proposal.derivedFrom) {
          const memory = this.store.get(memoryId);
          if (memory) this.store.update(memoryId, { domain: proposal.suggestedDomain });
        }
      }
      return undefined;
    }

    return this.store.add({
      content: proposal.content,
      type: proposal.type === "insight" ? "factual" : "preference",
      layer: "long_term",
      tags: [`dream:${proposal.type}`],
      confidence: 0.75,
      source: "dreaming",
      provenance: {
        origin: "dream",
        learnedAt: this.clock(),
        label: `approved ${proposal.type} proposal`,
      },
      derivedFrom: proposal.derivedFrom,
    });
  }

  reject(proposalId: string): void {
    const proposal = this.mustGetPending(proposalId);
    proposal.status = "rejected";
    this.ledger.log(proposalId, "dream_rejected", this.actor, {
      details: { type: proposal.type },
    });
  }

  private mustGetPending(proposalId: string): DreamProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== "proposed") {
      throw new Error(`H-MEM: no pending proposal ${proposalId}`);
    }
    return proposal;
  }

  private relatedness(first: MemoryRecord, second: MemoryRecord): number {
    return (
      0.5 * Math.max(0, cosine(first.embedding, second.embedding)) +
      0.2 * jaccard(first.tags, second.tags) +
      0.1 * (first.domain === second.domain ? 1 : 0) +
      0.2 * jaccard(first.entities, second.entities)
    );
  }

  private clusterMemories(): MemoryRecord[][] {
    const all = this.store.all();
    const used = new Set<string>();
    const clusters: MemoryRecord[][] = [];
    for (const seed of all) {
      if (used.has(seed.id)) continue;
      const group = [seed];
      for (const other of all) {
        if (other.id === seed.id || used.has(other.id)) continue;
        if (this.relatedness(seed, other) >= DEFAULTS.dreamRelatedness) group.push(other);
      }
      if (group.length < DEFAULTS.dreamClusterMinSize) continue;
      for (const member of group) used.add(member.id);
      clusters.push(group);
    }
    return clusters;
  }
}
