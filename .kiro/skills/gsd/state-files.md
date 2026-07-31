# GSD State Files

All state lives under `.gsd/` in the user's project root. Every subagent reads these files; only specific subagents write to specific files.

## File ownership

| File              | Read by              | Written by                    | Purpose                                          |
|-------------------|----------------------|-------------------------------|--------------------------------------------------|
| `PROJECT.md`      | all                  | orchestrator (init only)      | Vision, stack, constraints. Always loaded.       |
| `REQUIREMENTS.md` | all                  | orchestrator (init/edit)      | Scoped v1/v2 requirements with phase tracing.    |
| `ROADMAP.md`      | all                  | orchestrator                  | What's done, what's next, milestones.            |
| `STATE.md`        | all                  | orchestrator, planner, reviewer | Current decisions, blockers, position.         |
| `PLAN.md`         | implementer, reviewer | planner (overwrites)         | The single atomic task currently being executed. |
| `SUMMARY.md`      | all                  | implementer (append), reviewer (finalize) | Append-only history of completed tasks. |

## Schemas

### `PROJECT.md`
```markdown
# Project Vision

## What
One-paragraph product description.

## Stack
- Language / framework / build tool
- Test runner

## Constraints
- Hard constraints (perf, security, deploy target, licenses, etc.)

## Out of scope
- Things this project will not do.
```

### `REQUIREMENTS.md`
```markdown
# Requirements

## v1 (current)
- [ ] REQ-1: <one-line requirement>
- [ ] REQ-2: ...

## v2 (next)
- [ ] REQ-N: ...

## Phase traceability
| Req  | Phase | Status |
|------|-------|--------|
| REQ-1 | plan  | done   |
```

### `ROADMAP.md`
```markdown
# Roadmap

## Done
- 2026-05-28: Implemented X (commit abcd123)

## Now
- Implementing Y

## Next
- Z, then W
```

### `STATE.md`
```markdown
# State

## Position
Working on: REQ-2 (add CSV export)

## Decisions
- 2026-05-28: chose papaparse over csv-stringify (smaller, no deps)

## Blockers
- (none) | <description if any>

## Last verification
- PASS at 2026-05-28T10:11 — `pnpm test` 47 passed
```

### `PLAN.md`
```markdown
# Plan: <atomic task title>

## Objective
One sentence describing the smallest demoable change.

## Files to touch
- src/foo.ts (modify)
- src/foo.test.ts (create)

## Steps
1. ...
2. ...

## Verification
- Run: `pnpm test src/foo.test.ts` — must pass
- Run: `pnpm typecheck` — must pass
- Manual: <if any>

## Rollback
- `git restore src/foo.ts && rm src/foo.test.ts`
```

`PLAN.md` is **overwritten** by the planner each iteration. The implementer/reviewer never modify it.

### `SUMMARY.md`
```markdown
# Summary (append-only)

## 2026-05-28T10:11 — Add CSV export to reports
- Implementer: edited src/reports.ts (+42 -3), created src/reports.test.ts (+18)
- Reviewer: PASS — `pnpm test` 48 passed; `pnpm typecheck` clean
- Commit: <hash or "uncommitted">
```

The implementer appends a draft entry; the reviewer finalizes it (adds verdict and commit hash).

## Update rules

- **Atomic writes only.** Never partial-write. Read → mutate in memory → write whole file.
- **Append, don't rewrite,** for `SUMMARY.md`. The reviewer's finalization edits only the most recent entry.
- **PLAN.md is ephemeral.** Once a task lands and `SUMMARY.md` is updated, the planner is free to overwrite `PLAN.md` for the next task.
- **STATE.md mirrors current reality.** Always update `Last verification` after the reviewer runs.
- **No secrets** in any state file. If a config requires credentials, reference an env var name, not the value.

## What NOT to put in state files

- Generated code or large diffs (use git for that).
- Full transcripts of subagent conversations (use the session log).
- Speculative future work beyond `v2` (those go in `ROADMAP.md` if real, or are dropped).
