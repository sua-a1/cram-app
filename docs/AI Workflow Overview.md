# AI Workflow Overview

This file serves as a single source of truth for your AI-first development process in the “Cram” project. It references major rules files and outlines step-by-step instructions for session-based development with the Cursor Composer + Claude agent.

---

## 1. Purpose & Scope
• Provide concise instructions to maintain a consistent AI-driven workflow.  
• Ensure you always reference the following key documents before any major coding or architectural decision:
  1. @.cursorrules  
  2. @docs/prd.md (Project Requirements Document)  
  3. @docs/codebase-organization-rules.md  
  4. @docs/nextjs-rules.md  
  5. @docs/techstack-rules.md  
  6. @docs/ui-rules.md  
  7. @docs/Session Log Template.md  
• Facilitate frequent commits, clear session logs, and a coherent code structure that is easy for AI to parse.  
• Whenever you make changes or add new functionality related to the folder structure or API design, update the relevant documentation files (e.g., @docs/project-folder-structure.md, @docs/api-routes.md) to keep our docs fully in sync.

---

## 2. Workflow Steps

### Phase 1: Task Initialization  
1. Review and clarify the user request or goal.  
2. Create or update your task metadata in “@ai-working-notes.md” (or a relevant session file).  
3. Create a new session file based on @Session Log Template in the “/docs/sessions” folder.  
4. Break the request into smaller, trackable component tasks.  
5. Determine clear success criteria or acceptance tests for each task.  
6. Create an actionable, precise and detailed checklist for each task in the session file.

### Phase 2: Context Management  
1. Search relevant documentation in the “/cram-app” folder.  
2. Use the following available tools (in sequence if needed) to gather project context:  
   1. list_dir (to see the directory structure)  
   2. file_search (to locate a specific file by name)  
   3. codebase_search (for semantic queries on the codebase)  
   4. grep_search (for exact text matches)  
3. When exploring code:  
   – Note surrounding context.  
   – Check or follow imports.  
   – Identify any related or dependent files.  
4. If any crucial context is missing, request it explicitly.

### Phase 3: Task Execution & Coding  
1. Adhere to the code style and structure rules:  
   – TypeScript, Next.js, Shadcn UI, Radix UI, Tailwind, minimal custom components.  
   – Avoid creating new components if existing library components suffice.  
   – Maintain a functional and declarative approach.  
2. Address only the requested functionality. Do not alter unrelated parts of the code.  
3. Do not change database schema or server logic unless specified in the task.  
4. Commit small, consistent changes often with concise messages.

### Phase 4: Verification & Documentation  
1. After finishing a task, update the associated session .md file to list changes, reasons, and any open questions.  
2. If new or changed functionality affects existing tests, update or add corresponding unit/integration tests.  
3. Ask for user feedback if you encounter major design decisions.  
4. Respect environment variables and never leak credentials.  
5. If the implementation involves new API routes, server actions, or folder structure changes, update the corresponding files @docs/api-routes.md or @docs/project-folder-structure.md to reflect the latest state.

### Phase 5: Concluding the Session  
1. Summarize changes and next steps in your session.
2. Do NOT overwrite the session file so far, always add to it.
2. Make a final commit including docs and code changes.  
3. Confirm alignment with all relevant rule files (@.cursorrules, @docs/ui-rules.md, etc.).  
4. Mark the task as complete in the "Roadmap.md” if it corresponds to a project milestone.  
5. If applicable, confirm that the checklist in /docs/checklists/ for the current related milestone is updated and complete.

---

## 3. File References
1. “docs/Roadmap.md” → High-level milestones and major tasks.  
2. “docs/Session Log Template.md” → Template for logging each development session.  
3. “docs/prd.md” → Detailed requirements from the Project Requirements Document.  
4. “docs/codebase-organization-rules.md” → Organization guidelines.  
5. “docs/nextjs-rules.md” → Next.js 13+ guidelines.  
6. “docs/techstack-rules.md” → Supabase, TypeScript, Edge considerations.  
7. “docs/ui-rules.md” → UI standards (Shadcn, Radix, Tailwind).  
8. “docs/project-folder-structure.md” → Folder structure reference (update whenever directories or layout changes).  
9. “docs/api-routes.md” → API routes reference (update whenever adding or modifying endpoints).  

---