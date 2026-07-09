# AGENTS.md — read this first, every session

This repo is built docs-first. Before writing or changing any code:

1. Read, in order: `/docs/SPEC.md` → `/docs/STACK.md` → `/docs/ARCHITECTURE.md` →
   `/docs/TASKS.md` → `/docs/SEED_DATA.md`
2. Find the one task in TASKS.md marked "in progress." If none is marked, ask before
   picking one — don't guess which milestone to work on.
3. Only build what that task covers. Don't expand scope, rewrite unrelated files, or
   "improve" adjacent code without being asked — see PROJECT_PLAYBOOK.md's rule on
   targeted diffs vs. rewrites.
4. Reference the specific doc section you're implementing against (e.g. "per
   ARCHITECTURE.md's data flow step 2").
5. Never put secrets in client-side code. See STACK.md's "Required environment
   variables" — the Gemini key and Firebase service-account credentials are
   backend-only, always.
6. Any Gemini call must match the shape defined in ARCHITECTURE.md's "Gemini I/O
   contracts" — fixed enums, structured output, validated server-side. The model's raw
   output never becomes the source of truth for a severity or threshold value.
7. If something in these docs looks wrong or incomplete once you're actually
   implementing it, say so — don't silently work around it. The doc gets updated first,
   then the code follows.

**Stack**: React + TypeScript + Vite (frontend), FastAPI (backend), Firestore, Gemini
API. Full reasoning in STACK.md — don't substitute a different library or pattern
without checking there first.
