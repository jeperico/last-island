---
name: gsd
description: Get Shit Done (GSD) workflow for Kiro — orchestrator + 4 subagents (researcher/planner/implementer/reviewer) that drive a Plan→Execute→Verify loop with persistent state files in .gsd/. Load when the user invokes /agent gsd, runs @gsd-init, or asks to use the GSD workflow on a task.
---

# GSD on Kiro

GSD ("Get Shit Done") is a context-engineering workflow ported from the Claude Code plugin to Kiro. Its goal is to keep the main session lean by spawning **fresh subagents per task** and routing their results through **persistent state files** in the user's project at `.gsd/`.

## When to use

- The user invokes `/agent gsd` or asks for the GSD workflow.
- The user runs `@gsd-init` to bootstrap a new project.
- A task is large enough to benefit from explicit Plan → Execute → Verify phases.

For trivial one-line edits, normal direct work is fine — GSD pays off when the task touches multiple files, requires verification, or will span sessions.

## Mental model

```
User → gsd (orchestrator) ──▶ subagent DAG ──▶ state files in .gsd/
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
gsd-researcher          gsd-implementer            gsd-reviewer
(read-only)             (writes code,              (runs tests,
                         appends SUMMARY)           updates STATE)
       └────────────▶ gsd-planner ◀───────────────┘
                      (writes PLAN.md)
```

Each subagent runs in its own fresh session via Kiro's `subagent` tool. The orchestrator's main context stays small — it only sees `summary` results from each stage plus the state files in `.gsd/`.

## Loop the orchestrator runs

1. **Init check.** If `.gsd/` is missing, offer to run `gsd-init` (interview the user to create `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, empty `STATE.md`, empty `PLAN.md`, empty `SUMMARY.md`).
2. **Research.** Spawn `gsd-researcher` with the task description; it reads relevant code and existing state files and reports findings.
3. **Plan.** Spawn `gsd-planner`, passing the research summary. It writes a single atomic task to `.gsd/PLAN.md` with: objective, files to touch, exact verification steps, rollback plan.
4. **Execute.** Spawn `gsd-implementer`. It reads `PLAN.md`, makes the changes, appends a one-line entry to `SUMMARY.md`. No commits — that's the orchestrator's call.
5. **Verify.** Spawn `gsd-reviewer`. It runs the verification steps from `PLAN.md`, updates `STATE.md` with PASS/FAIL + blockers, finalizes the `SUMMARY.md` entry.
6. **Decision.** On PASS, the orchestrator may make an atomic git commit (with user confirmation) and advance `ROADMAP.md`. On FAIL, re-spawn implementer + reviewer with the blocker as added context. After 2 failures, escalate to the user.

## Reference docs in this skill

- `state-files.md` — schema and update rules for the 6 `.md` files.
- `workflow-phases.md` — what each phase produces and consumes.
- `README.md` — short user-facing usage guide.

## Out of scope (vs full GSD)

- **Wave execution** (parallel multi-task DAGs).
- **Atomic-commit-per-task automation** (orchestrator only suggests commits).
- **Model profiles**, **milestone archival**, **brownfield analysis**.

These can be added later without breaking the minimal version.
