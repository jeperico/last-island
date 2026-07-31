# GSD Workflow Phases

Every task the orchestrator runs flows through these phases. Each phase has a defined input, output, and the agent responsible.

## Phase 1 — Init (one-time)

- **Trigger:** `.gsd/` missing in project root, or user runs `@gsd-init`.
- **Agent:** `gsd` (orchestrator) — handled inline, no subagent.
- **Input:** Conversation with the user (questions about vision, stack, constraints, requirements).
- **Output:** Six files created under `.gsd/` per `state-files.md` schemas. `PLAN.md` and `SUMMARY.md` start empty (with headings only).
- **Exit criteria:** All six files exist and are non-empty (except `PLAN.md`/`SUMMARY.md`).

## Phase 2 — Research

- **Trigger:** New task description from the user.
- **Agent:** `gsd-researcher` (read-only).
- **Input via `prompt_template`:** `{task}` plus a pointer to `.gsd/` for existing state.
- **Output:** A `summary` tool call back to the orchestrator with:
  - relevant existing code (file:line refs),
  - existing patterns to follow,
  - risks and unknowns,
  - suggested verification approach.
- **Forbidden:** Writing files, running mutating commands, opening network sockets to write services.

## Phase 3 — Plan

- **Trigger:** Research summary received.
- **Agent:** `gsd-planner`.
- **Input via `prompt_template`:** the original task + the researcher's summary.
- **Output:**
  - Overwrites `.gsd/PLAN.md` with one atomic task (per schema in `state-files.md`).
  - Updates `.gsd/STATE.md` `Position` field.
  - Calls `summary` with a one-paragraph plan abstract.
- **Atomicity rule:** A "plan" is one cohesive change that can be reviewed in a single PR/commit. If the task is too big, the planner declines and lists the smaller atomic plans needed, in order; the orchestrator picks the first.

## Phase 4 — Execute

- **Trigger:** `PLAN.md` written.
- **Agent:** `gsd-implementer`.
- **Input via `prompt_template`:** "Read `.gsd/PLAN.md` and execute it exactly." Plus task name.
- **Output:**
  - Code changes per `Files to touch` and `Steps`.
  - Appends a draft entry to `.gsd/SUMMARY.md` with files changed and net line counts.
  - Calls `summary` with what was done.
- **Forbidden:** Making git commits, modifying files outside `Files to touch` without justification in the summary, mutating `PLAN.md` or `STATE.md`.

## Phase 5 — Verify

- **Trigger:** Implementer reports done.
- **Agent:** `gsd-reviewer`.
- **Input via `prompt_template`:** "Read `.gsd/PLAN.md` `Verification` section and run each step. Report PASS/FAIL."
- **Output:**
  - Runs each verification command via `execute_bash`.
  - Updates `.gsd/STATE.md` `Last verification` and `Blockers`.
  - Finalizes the latest `.gsd/SUMMARY.md` entry (verdict, evidence).
  - Calls `summary` with verdict + evidence.

## Phase 6 — Decision

- **Trigger:** Reviewer verdict received.
- **Agent:** `gsd` (orchestrator) — inline.
- **On PASS:**
  - Show diff to the user.
  - If user approves, make an atomic commit (e.g. `git add -A && git commit -m "<plan title>"`).
  - Append to `ROADMAP.md` `## Done`.
  - Clear `PLAN.md` (leave heading only) so the next task starts clean.
- **On FAIL (≤2 retries):**
  - Inject the blocker from `STATE.md` into a re-spawned `gsd-implementer` + `gsd-reviewer` chain.
- **On FAIL (>2 retries):**
  - Stop. Surface the blocker to the user with a concrete next-step question.

## Subagent invocation skeleton

The orchestrator uses Kiro's `subagent` tool with a DAG like this for a normal task:

```json
{
  "task": "<concise task title>",
  "stages": [
    {
      "name": "research",
      "role": "gsd-researcher",
      "prompt_template": "Research the following task. Read .gsd/ state files first, then relevant code. Task: {task}"
    },
    {
      "name": "plan",
      "role": "gsd-planner",
      "prompt_template": "Plan an atomic implementation for: {task}. Use the prior research summary.",
      "depends_on": ["research"]
    },
    {
      "name": "implement",
      "role": "gsd-implementer",
      "prompt_template": "Execute .gsd/PLAN.md exactly. Task: {task}",
      "depends_on": ["plan"]
    },
    {
      "name": "review",
      "role": "gsd-reviewer",
      "prompt_template": "Verify .gsd/PLAN.md was implemented correctly by running its Verification section. Task: {task}",
      "depends_on": ["implement"]
    }
  ]
}
```

Each stage runs in a fresh session — that's the context-rot fix. State flows between stages **only** through `.gsd/*.md` files and the `summary` tool's return value, never through long shared transcripts.
