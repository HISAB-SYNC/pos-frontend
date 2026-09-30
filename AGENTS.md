<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions & Rules

## Project State Management
- Read `PROJECT_STATE.md` first at the start of every session to immediately understand current progress, recent decisions, and next steps.
- Always keep `PROJECT_STATE.md` updated as changes are made or before wrapping up, matching the template structure so work can be resumed seamlessly.

## UI Design Guidelines
- for each project: Follow the anti-ai-look skill for all UI work, alongside ui-style.

## Skills Policy
- **DO NOT USE SKILLS**: Do not invoke, load, or rely on any skills in this project. All tasks, git operations, and reviews must be performed directly using standard tools.

## Development & Code Guidelines
- **Framework & Architecture**: Next.js App Router (15+), TypeScript, Tailwind CSS, Lucide React icons.
- **Verification**: Always run `npm run typecheck` to verify that there are no type errors before completing changes.
- **Scoped Edits**: Match existing patterns and keep changes focused. Avoid unnecessary refactors or broad file scans.

## Git & Staging Guidelines
- **Granular Commits**: Never stage or commit everything at once. Stage related groups of files into atomic commits.
- **Conventional Commits**: Format commit messages as `feat(...)`, `fix(...)`, `docs(...)`, `chore(...)`, `refactor(...)`.
- **Author Identity**: Git author must strictly be `muhammed-shamsdin <muhammedsamsoon@gmail.com>`. Never add AI co-author trailers.
- **No Pushing**: Do not push to remote unless explicitly asked.
- **Exclude Guide Files**: NEVER commit `.md` guide files (e.g. `API_GUIDE.md`, `*_API_GUIDE.md`, audit reports, UI guides). Keep them untracked / ignored.

