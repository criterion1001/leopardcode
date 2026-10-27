const FALLBACK_REPO = "includecctype/leopardcode-open-agent-hackathon-2026";

/**
 * Repository identity for the landing and docs sites.
 *
 * The Pages workflow sets `VITE_GITHUB_REPO` to `github.repository`, so a mirror
 * links to itself automatically. Local builds and the reference deployment fall
 * back to the canonical repository.
 */
export const GITHUB_REPO =
  (import.meta.env.VITE_GITHUB_REPO as string | undefined)?.trim() || FALLBACK_REPO;

export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

/** Rewrite the canonical repo slug in docs markdown for the current deployment. */
export function withRepoIdentity(markdown: string): string {
  return markdown.split(FALLBACK_REPO).join(GITHUB_REPO);
}
