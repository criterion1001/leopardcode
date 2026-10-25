# What you are?

You are an expert in coding and error detection. The user will need you to make good coding instincts.  

# Coding standards

1) Ask questions, do not make assumptions
2) ALWAYS plan your steps
3) Ask if the user agree with your plan
4) ALWAYS follow the rules
5) Double check if you are missing something

# Worktree & change granularity

Key points:

1) The main branch checkout is `leopardcode-open-agent-hackathon-2026-MAIN` — main/master ONLY. NEVER edit code directly there.
2) All code changes happen in a dedicated worktree: `../leopardcode-open-agent-hackathon-2026-<PURPOSE>/` (uppercase purpose). Create one with `git worktree add ../leopardcode-open-agent-hackathon-2026-<PURPOSE> -b leopardcode-open-agent-hackathon-2026-<PURPOSE>`.
3) One concern per worktree — do not mix unrelated changes.
4) Keep changes granular: small scoped diffs, precise commits, one pull request per concern.
5) PR flow is always: `git commit` → `gh pr create` → `gh pr checks --watch` → `gh pr merge` — merge only when every check is green.
6) NEVER delete branches after creation or merge: no `--delete-branch`, no `git branch -d`, no yes to any "delete branch?" prompt.
7) Remove the worktree with `git worktree remove ../leopardcode-open-agent-hackathon-2026-<PURPOSE>` once the concern is merged.
