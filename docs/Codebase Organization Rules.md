# Codebase Organization Rules

These guidelines are designed to facilitate AI-first development and code maintenance within the Cursor Composer environment.

1. Monolithic Folders & “Mega Files”  
   - Consolidate domain logic in large “mega” modules (e.g., tickets-logic.ts) for easier AI scanning.  
   - Group related components and pages within feature-based subfolders in “app/” (for Next.js 13) or “pages/” (pre-13).

2. Shared Types & Utilities  
   - Place shared types in “/types” or “/app/lib/types” for cross-cutting concerns (Ticket, User, etc.).  
   - Centralize Supabase logic (DB queries, RLS checks) in “/app/lib/server/” or “/lib/server/” modules.

3. Single Source of Truth for Business Logic  
   - Keep complex business logic in a single domain-logic file or a small set of feature-based files.  
   - Avoid scattering logic across multiple files, so AI can more easily parse and adapt it.

4. Minimal Edge Functions  
   - For near-user tasks (auth rewrites, route checks), consider Next.js Edge Middleware or Supabase Edge Functions.  
   - Keep them minimal—push heavier tasks to server components or route handlers.

5. Naming & Structure  
   - Use a consistent naming scheme (e.g., “page.tsx”, “layout.tsx”, “route.ts”, “server-actions.ts”).  
   - Use “use client” sparingly, only for interactive components.

6. References  
   - See “./nextjs-rules.md” for Next.js organizational best practices.  
   - See “./prd-rules.md” for additional references from the Project Requirements Document (PRD).
