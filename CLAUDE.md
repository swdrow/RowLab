# oarbit

Rowing lineup management SaaS - React 18 frontend + Express backend + PostgreSQL/Prisma.

## Quick Start

```bash
npm run dev:full     # Frontend (3001) + Backend (8000)
npm run dev          # Frontend only
npm run server       # Backend only
```

## Commands

| Task | Command |
|------|---------|
| Tests | `npm run test` (watch) or `npm run test:run` |
| Lint + Type + Test | `npm run validate` |
| DB migrate | `npm run db:migrate` |
| DB reset + seed | `npm run db:reset` |
| DB GUI | `npm run db:studio` |
| Format | `npm run format` |

## Architecture

- **Frontend:** `src/` - React 18, Zustand, Tailwind, Vite
- **Backend:** `server/` - Express, Prisma, Socket.IO
- **Database:** PostgreSQL via Prisma (`prisma/schema.prisma`)
- **V2 Redesign:** `src/v2/` - In-Place Strangler pattern, `/app` route (default)
- **V1 Legacy:** accessible at `/legacy`

## Key Patterns

- **API namespace:** All routes under `/api/v1/`
- **State:** Zustand stores in `src/store/`, server state via TanStack Query v5
- **V1/V2 coexistence:** V2 components in `src/v2/`, shares V1 Zustand stores
- **CSS isolation:** V2 uses `.v2` class scoping to prevent conflicts
- **Forms:** react-hook-form + Zod validation (all V2 forms)
- **Drag-drop:** @dnd-kit with spring physics animations
- **Charts:** recharts for data visualization

## Testing

- Vitest + Testing Library
- Tests adjacent to source: `Component.jsx` → `Component.test.jsx`
- Coverage: `npm run test:coverage`
- New components SHOULD have at least a smoke test

## Gotchas

- TypeScript migration in progress - new files should be `.tsx`
- Prisma client regenerate after schema changes: `npx prisma generate`
- OAuth redirects use port 3001 (frontend), not 8000 (backend)
- Real-time collab uses Socket.IO - check `server/socket/`

---

## CRITICAL RULES

### No Placeholders, No Fakes, No Dead Ends

This is the most important rule for this project. Every element must be real or explicitly tracked:

- **Every button must have a functional handler.** No empty `onClick`, no `console.log` stubs, no `// TODO` without a phase reference.
- **Every link must go somewhere real.** No `href="#"`, no `javascript:void(0)`, no links to non-existent routes.
- **Every "Learn more" / "Docs" / "Help" link must have a real target** or must not be rendered at all.
- **No hardcoded mock data in production paths.** Data comes from the database or is clearly marked as seed/demo data.
- **No placeholder copy.** No "Lorem ipsum", "Coming soon", or "TBD" in rendered UI.
- **Forms must submit to real endpoints.** No forms that silently do nothing on submit.
- **If a feature can't be fully implemented**, build it as a proper skeleton with:
  - A `// TODO(phase-XX-YY): [description]` comment
  - Tracked in `.planning/STATE.md`
  - The UI should either not render the feature or show a clear "not yet available" state behind a feature toggle

### Deferred Work = GitHub Issue

When deferring work to move forward with the current task, **always create a GitHub issue** to track it:

- Use `gh issue create` with a clear title, description, repro steps, and fix approach
- Add appropriate labels (`bug`, `enhancement`, `tech-debt`, etc.)
- Reference the issue number in code comments: `// TODO(#2): Fix PDF export V1/V2 shape mismatch`
- **Never leave deferred work as just a code comment or mental note** — if it's worth deferring, it's worth tracking

### Database Safety

**NEVER wipe, reset, or destroy database data without explicit user permission.**

- All migrations MUST preserve existing data: test users, admin accounts, seed data, everything
- NEVER run `prisma migrate reset`, `db push --force-reset`, or any destructive command
- ASK PERMISSION before running any database migration or schema change
- When modifying schema: use `prisma migrate dev` to create proper migration files
- Always verify migration preserves data by checking record counts before and after
- Document any schema changes in `.planning/STATE.md` decisions table

### Solo Developer Testing

This is a one-person project. For multi-user features:

- The admin account has access to everything including debug views
- Test multi-user flows by switching between admin and test user accounts
- Real-time features (Socket.IO) must handle single-connection gracefully
- For team features: verify they work with 1 user + seed data athletes
- Document how to manually test any feature that normally requires multiple users

### Design System Compliance

Before any UI work, read the oarbit design spec: `docs/plans/2026-02-21-oarbit-rebrand-design.md`. Quick reference: `.claude/design-standard.md`. Key rules:

- All colors oklch — never hex, never standard Tailwind colors
- Void-surface panels with shadow-card — NO glass morphism, NO backdrop-filter on cards
- Typography: Space Grotesk (display), Inter (body), Space Mono (data)
- Four accents with defined roles: teal (interactive), sand (warm emphasis), coral (alerts), ivory (light)
- Loading states: skeleton loaders with shimmer, NEVER spinners
- Banned: `bg-gray-*`, pill buttons, staggered animations, animated counters, gradient borders, generic icon libraries

### Documentation as You Go

- Update `.planning/STATE.md` with decisions and progress after each session
- Mark completed plans in `.planning/ROADMAP.md`
- **When `.planning/ROADMAP.md` phase status changes, also update the `## Roadmap` section in `README.md`** — this is the public-facing roadmap visible on GitHub. Use a Haiku/Sonnet subagent or Gemini to draft the update.
- Use `// TODO(phase-XX-YY): description` format — never bare `// TODO`
- Add code comments ONLY where logic isn't self-evident
- Run `/integrity-check` after implementing features
- Run `/session-log` before ending sessions or when context is heavy

### Industry-Standard UX

Before implementing user-facing features:
- Consider how best-in-class tools handle this (Linear, Raycast, Vercel, Strava, TrainingPeaks)
- Think about edge cases: empty states, error states, loading states, offline states
- Optimistic UI for mutations — never show blocking spinners
- Keyboard shortcuts for power users
- Responsive: works at 375px mobile through 1440px desktop

### Gemini Minion — Context Preservation Strategy

**Claude's context window is expensive and limited. Gemini has 1M+ tokens. Offload aggressively.**

The Gemini minion MCP server (`gemini-minion`) runs Gemini CLI tasks in the background. Use it as the default for any operation that consumes significant context without requiring Claude's reasoning quality.

**ALWAYS delegate to Gemini for:**

| Task | Why Gemini |
|------|-----------|
| Reading 3+ files at once | Gemini's 1M context handles bulk reads without pressure |
| Codebase exploration / file discovery | Scanning hundreds of files is context grunt work |
| Searching for patterns across many files | Grep results analysis across the codebase |
| Reading large files (>200 lines) | Don't burn Claude tokens on file ingestion |
| Summarizing existing code | Gemini reads and summarizes, Claude gets the summary |
| Documentation research | Gemini reads docs, Claude applies the knowledge |
| Architecture mapping | Multi-file understanding before Claude makes decisions |
| Generating boilerplate | Templates, repetitive CRUD, type definitions |
| Reviewing file contents before editing | Let Gemini read, Claude decides what to change |
| Comparing implementations | Side-by-side analysis of multiple files |

**Claude should handle directly:**
- Architectural decisions and design choices
- Complex debugging requiring reasoning chains
- Writing nuanced UI code (design system compliance)
- Code review judgment calls
- User-facing communication
- Final editing of files (Claude writes, Gemini reads)

**How to use:**

```
# Dispatch a background task
gemini_dispatch("Read all files in src/v2/features/athletes/ and summarize the component hierarchy, props, and data flow")

# Check status
gemini_task_status(taskId)

# Get result when done
gemini_task_result(taskId)
```

**Pattern: Read-then-Act**
1. Dispatch Gemini to read and summarize relevant files
2. Continue other work while Gemini processes
3. Retrieve Gemini's summary
4. Use the summary to make informed edits (Claude handles the actual writing)

**Pattern: Bulk Analysis**
1. Dispatch Gemini: "Find all components using `bg-gray-900` that violate the design standard"
2. Gemini scans 600+ files, returns a focused list
3. Claude fixes only the flagged files

**Pattern: Pre-Phase Research**
1. Before starting a new phase, dispatch Gemini: "Read all plan files in .planning/phases/XX/ and summarize what needs to be built, key decisions, and dependencies"
2. Claude gets a condensed brief instead of reading 10+ plan files directly

---

## Planning

GSD workflow files in `.planning/`:
- `ROADMAP.md` — Phase tracking (23 phases across 4 milestones)
- `STATE.md` — Current state, decisions, session continuity
- `phases/` — Per-phase plans and research
- `codebase/` — Architecture documentation

### Current State

- **v2.1 Milestone** in progress
- Phase 17 (Design Overhaul) — 7/8 plans, needs verification
- Phase 19 (Warm Design System) — 5/6 plans, needs verification
- Next: complete v2.1, then v2.2 (Telemetry, AI, Predictive, Coxswain)

## Custom Skills

- `/integrity-check` — Scan for placeholder buttons, fake links, dead-end navigation
- `/session-log` — Update planning docs with session progress before ending

## Custom Agents

- `code-reviewer` — Reviews changes against design system, integrity rules, accessibility
- `doc-keeper-planning` — Background Haiku agent: keeps STATE.md, ROADMAP.md, REQUIREMENTS.md current
- `doc-keeper-public` — Background Sonnet agent: keeps README, changelog, technical docs, and versioning current
- `doc-updater` — ~~DEPRECATED~~ Superseded by doc-keeper system

## Doc-Keeper — Automatic Background Documentation

Doc-Keeper keeps all documentation current by spawning background agents at checkpoint moments. Two tiers with different models handle different doc scopes.

**Design:** `docs/plans/2026-02-26-doc-keeper-design.md`

### When to Spawn

**After every git commit or GSD plan completion — Tier 1 only (Haiku):**

Spawn via Task tool:
- `subagent_type: "general-purpose"`
- `model: "haiku"`
- `run_in_background: true`
- `name: "doc-keeper-planning"`
- Prompt: Tell it to read `.claude/agents/doc-keeper-planning.md` for instructions, then provide:
  - Trigger: `commit` or `plan-complete`
  - Git diff summary (short description of what changed)
  - Files modified (list)
  - Current phase number
  - Current version from package.json

**After phase completion, verification, or branch finishing — Both tiers:**

Spawn Tier 1 (Haiku) as above, PLUS Tier 2-3 (Sonnet):
- `subagent_type: "general-purpose"`
- `model: "sonnet"`
- `run_in_background: true`
- `name: "doc-keeper-public"`
- Prompt: Tell it to read `.claude/agents/doc-keeper-public.md` for instructions, then provide:
  - Trigger: `phase-complete`, `verification-pass`, or `branch-finishing`
  - Git diff summary
  - Files modified
  - Current phase number
  - Current version from package.json
  - Version bump needed: `patch`, `minor`, or `major`
  - Changelog since last bump: git log --oneline output since last version tag

**After milestone completion — Tier 2-3 only (Sonnet):**

Spawn the Sonnet agent with `milestone-complete` trigger and `major` version bump.

**Before session end (when /session-log runs) — Both tiers:**

Spawn both agents with `session-end` trigger as a final documentation sweep.

### Model Selection

| Tier | Model | Speed | Scope |
|------|-------|-------|-------|
| Tier 1 | Haiku | ~3-5s | STATE.md, ROADMAP.md, REQUIREMENTS.md, TODO audit |
| Tier 2-3 | Sonnet | ~10-20s | README.md, changelog, package.json version, technical docs |

### Rules

- Both agents run in background — never block development work
- Both agents are documentation-only — they never modify source code
- If an agent reports warnings (e.g., bare TODOs), address them before the next commit
- The Sonnet agent will suggest git tags — confirm and run them manually when ready

---

## Git & GitHub Workflow

**Repository:** `swdrow/RowLab` (GitHub, SSH)
**Main branch:** `master`
**Auth:** `gh` CLI authenticated as `swdrow`

### Branch Strategy

Use feature branches for all non-trivial work:

```
feature/phase-XX-description   # New phase work
fix/issue-description           # Bug fixes
refactor/area-description       # Refactoring
design/component-or-section     # Design work
```

### Git Worktrees

Use worktrees for parallel development or isolating experimental work:

```bash
# Create worktree for a phase
git worktree add .worktrees/phase-17 -b feature/phase-17-design-overhaul

# List active worktrees
git worktree list

# Remove when done
git worktree remove .worktrees/phase-17
```

**Existing worktree:** `.worktrees/ux-redesign` on `feature/ux-redesign-multi-persona`

### Commit Convention

```
type(scope): present-tense description

# Types: feat, fix, refactor, style, docs, test, chore, perf
# Scope: phase number or feature area
# Examples:
feat(phase-17): add warm color token system
fix(lineup-builder): correct drag-drop swap logic
docs(plans): update ROADMAP.md with Phase 19 status
test(erg-data): add smoke tests for CSV import wizard
```

Always sign commits: `git commit -S`

### Pull Requests

Create PRs for completed phases or significant feature chunks:

```bash
gh pr create --title "feat(phase-XX): description" --body "..."
```

PR body should reference:
- Phase/plan numbers from ROADMAP.md
- Key decisions made (reference STATE.md)
- Testing notes for solo developer verification
- Screenshots/recordings for UI changes

### GitHub Issues

Use issues to track bugs, feature ideas, and phase-level work:

```bash
gh issue create --title "Bug: description" --label "bug"
gh issue create --title "Phase 20: Telemetry" --label "phase,planned"
gh issue list --state open
```

### Workflow Per Phase

1. Create feature branch: `git switch -c feature/phase-XX-name`
2. Implement plans, committing atomically per plan
3. Run `/integrity-check` and `/session-log`
4. Push branch and create PR: `gh pr create`
5. Run `/coderabbit:review` on the PR
6. Merge to master when verified
7. Tag milestones: `git tag v2.1.0 -m "v2.1 Feature Expansion"`
