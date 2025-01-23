# Supabase Integration Rules

## Authentication Flow

1. **Client-Side Authentication**
   - Use client-side auth for sign-in/sign-up (`signInWithPassword`, `signUp`)
   - Let Supabase handle cookie management
   - Don't manually redirect after auth - use auth state listener

2. **Auth State Management**
   - Use `SupabaseAuthProvider` for managing auth state
   - Listen to auth events (`onAuthStateChange`) for navigation
   - Check organization/role in auth state change handler
   - Avoid checking auth state in individual pages

3. **Protected Routes**
   - Use middleware for protecting routes
   - Refresh session in middleware for SSR
   - Define public routes explicitly
   - Handle role-based access in middleware

4. **Auth Pages**
   - Make auth forms client components
   - Use auth provider for current user state
   - Keep forms simple - let Supabase handle session
   - Avoid server components for auth pages

## Data Access Patterns

1. **Server Components**
   - Use `createServerSupabaseClient()` for data fetching
   - Handle errors gracefully with proper typing
   - Use RLS policies for security

2. **Client Components**
   - Use `createClient()` for real-time and mutations
   - Handle optimistic updates when appropriate
   - Use proper error handling and loading states

## Best Practices

1. **Session Management**
   - Don't manually manage cookies
   - Let Supabase handle session refresh
   - Use middleware for session checks
   - Avoid mixing client/server auth checks

2. **Error Handling**
   - Type your errors properly
   - Show user-friendly error messages
   - Log errors for debugging
   - Handle edge cases (no session, expired token)

3. **Security**
   - Always use RLS policies
   - Never expose sensitive data to client
   - Validate data on server side
   - Use proper role-based access control

---

## 1. Environment
• Use remote Supabase only; no local DB.  
• Store secrets in .env; expose only anon/public keys (NEXT_PUBLIC_...).  

## 2. PKCE + SSR
• Generate code_verifier and code_challenge securely (no long-term storage).  
• Use SSR for auth.  
• Finish the OAuth flow on the server (avoid exposing tokens).  
• Register all redirect URLs in Supabase.

## 3. Auth & Security
• RLS enforced on sensitive tables.  
• Validate all user input server-side.  
• Use Supabase Auth Hooks and error codes.

## 4. Migrations & Schema
• Place each DB change in /supabase/migrations (one .sql per change).  
• Never directly modify prod DB.  
• Keep docs/initial-schema.md current.

## 5. Data Fetching & Realtime
• SSR logic: server components or /app/api/route.ts.  
• Client side: only anon/public keys for realtime.  
• Admin tasks remain on the server.

## 6. Testing & Verification
• Write tests for CRUD, migrations, PKCE flow.  
• Separate dev/prod environment configs.  

## 7. Additional Tips
• Fetch minimal columns.  
• Log major changes.  
• Check release notes regularly.  
• Follow official Supabase integration steps.

---

## 1. Environment & Connection
• Always connect to the remote Supabase project (not local).  
• Put Supabase credentials (URL, anon key, and especially service_role key) in .env files; never commit them.  
• Expose only the anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) to the client when required.  

---

## 2. Database Design & Migrations
• Manage schema changes through SQL migrations in /supabase/migrations (one file per change).  
• Never directly alter the production database outside migrations.  
• Keep the initial schema in a dedicated file (e.g., docs/initial-schema.md) and update it as needed.  

---

## 3. Auth & Security
• Use Supabase Auth for user signups/logins; store minimal user profile info in Supabase.  
• For server-only key usage (service_role, private JWT configs), keep them strictly on the server side.  
• Enforce Row-Level Security (RLS) on tables storing sensitive data; reference supabase policies in your migrations.  

---

## 4. Server & Client Components
• In Next.js 13, place your Supabase server logic (select, insert, update, delete) in server components or route handlers (/app/api/<route>/route.ts).  
• "use client" only for interactive UI (e.g., form submissions, real-time data).  
• Avoid shipping server_role or sensitive code to the frontend.  

---

## 5. Data Fetching & Realtime
• For SSR or server component logic, import the centralized Supabase client (e.g., /app/lib/server/supabase.ts).  
• On the client side, use only the anon/public key to track real-time updates (e.g., ticket changes).  
• Keep heavy or privileged operations (like admin tasks) on the server.  

---

## 6. Testing & Verification
• Write server-side tests for crucial Supabase interactions (CRUD, policies, triggers).  
• Validate input before sending to Supabase, even if the DB enforces constraints.  
• Confirm the correct environment is used (production vs. development), with separate credentials and .env files.  

---

## 7. Additional Guidelines
1. Only create new API routes when necessary; prefer server components for direct DB queries.  
2. Keep logs or session notes for significant schema changes in docs or /supabase/migrations.  
3. Favor incremental, minimal queries to avoid extraneous data fetching (e.g., fetch only needed columns).  
4. Use strict TypeScript types (generated or manual) to ensure data consistency.  

--- 