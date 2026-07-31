# GSD on Kiro — User Guide

A minimal port of the [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) workflow to Kiro CLI. Use it when a task is big enough that you want explicit Plan → Execute → Verify phases with persistent state, instead of one long chat.

## What's installed

```
.kiro/agents/
  gsd.json              ← orchestrator
  gsd-researcher.json   ← read-only investigation
  gsd-planner.json      ← writes .gsd/PLAN.md
  gsd-implementer.json  ← writes code (no commits)
  gsd-reviewer.json     ← runs verification, updates STATE/SUMMARY
  gsd-tester.json       ← writes tests & Bruno API docs
.kiro/skills/gsd/
  SKILL.md              ← workflow overview (loaded on demand)
  state-files.md        ← schema for the 6 .md files
  workflow-phases.md    ← phase contract + DAG skeleton
  README.md             ← this file
```

## Quick start

```bash
cd ~/work/last-island
kiro-cli chat
```

Inside Kiro:

```
/agent gsd
@gsd-init                  # only the first time, in this project
```

After init, give it a task:

```
add a CSV export button to the reports page
```

The orchestrator will:
1. Spawn `gsd-researcher` (fresh session) → finds relevant code, reports back.
2. Spawn `gsd-planner` (fresh session) → writes `.gsd/PLAN.md`.
3. Spawn `gsd-implementer` (fresh session) → executes `PLAN.md`, appends to `.gsd/SUMMARY.md`.
4. Spawn `gsd-reviewer` (fresh session) → runs `PLAN.md` Verification, updates `.gsd/STATE.md`.
5. On PASS, ask you whether to commit. On FAIL, retry up to 2× with the blocker as added context.

## The six state files (in your project's `.gsd/`)

| File              | What it holds                                                      |
|-------------------|--------------------------------------------------------------------|
| `PROJECT.md`      | Vision, stack, constraints (set during init).                      |
| `REQUIREMENTS.md` | v1 / v2 requirements with phase tracing.                           |
| `ROADMAP.md`      | What's done, current focus, what's next.                           |
| `STATE.md`        | Current decisions, blockers, last verification result.             |
| `PLAN.md`         | The single atomic task currently being executed (overwritten).     |
| `SUMMARY.md`      | Append-only history of completed tasks (with verdicts and commits).|

## Recovery

If the pipeline gets stuck:

- **Reviewer keeps failing.** Check `.gsd/STATE.md` `Blockers` section. Either fix manually and ask the orchestrator to re-verify, or rewrite the task and start over.
- **Implementer goes off-scope.** It is constrained by `deniedPaths` and is told to refuse deviations from `PLAN.md`.
- **Stale plan after a failed task.** Tell the orchestrator "discard the current plan" — it will clear `.gsd/PLAN.md`.
- **Need to inspect a stage's reasoning.** Open Kiro's session monitor (`Ctrl+G`) — each stage is its own session.

## Database access

All GSD agents have access to the PostgreSQL MCP server (`@postgresql`) for querying the local dev database. This is useful for research (checking schema, data) and verification (confirming migrations ran correctly).
