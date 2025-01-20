# Next.js Consolidated Rules
# Derived from “Next.js Rules.md,” “Next Supabase Rules.md,” and “Next.js Rules With Edge.md”

1. Directory & Routing (Next.js 13)  
   - Use the “app” directory.  
   - Keep server components for data-fetching and direct DB/Supabase interactions.  
   - Mark components with “use client” only if they require browser APIs or interactivity.

2. Data Fetching & SSR  
   - For dynamic or user-specific data, use server components.  
   - Return data as props to client components only when absolutely necessary.  
   - Keep queries in “/app/lib/server” or route handlers (e.g., /app/api/route.ts).

3. Edge Considerations  
   - Use Next.js Edge Middleware or Supabase Edge Functions for near-user tasks.  
   - Avoid heavy computations in edge environment due to memory/CPU constraints.  
   - Keep secrets out of edge contexts; rely on server-side environment for privileged tasks.

4. Supabase Integration  
   - Maintain service role or privileged keys in server-only modules.  
   - For real-time updates, use the Supabase client library on the client side with minimal overhead.  
   - Type-check all responses (with TypeScript or a generated types file).

5. Styling & UI Patterns  
   - Use Tailwind for styling, Shadcn UI & Radix UI for components.  
   - Keep layout minimal; only fetch data shared across multiple child routes.  
   - Avoid nested custom CSS if a utility or UI library solution exists.

6. Testing & Security  
   - Write server-side tests for DB operations, ensure RLS rules are enforced.  
   - Use environment variables for secrets (no direct references to process.env in client code).  
   - Validate all user input server-side, even if client has disclaimers.

7. References  
   - See “./codebase-organization-rules.md” for overall file structure.  
   - See “./ui-rules.md” for more on styling and component usage.
