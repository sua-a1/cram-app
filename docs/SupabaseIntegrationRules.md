# Supabase Integration Rules

## Authentication & Session Management

1. Auth Provider Setup
   ```typescript
   // Always use PKCE flow
   const supabase = createClient({
     auth: {
       flowType: 'pkce',
       detectSessionInUrl: true,
     },
   })
   ```

2. Session Initialization
   - Always check initial session on mount
   - Handle all relevant auth events
   - Add proper cleanup on unmount
   - Use proper error handling

3. Sign Out Process
   - Use global scope to sign out all tabs
   - Clear local and session storage
   - Force hard navigation to sign-in page
   - Add proper error handling

## Client Usage

1. Client Creation
   - Create client instance at auth provider level
   - Pass client through context
   - Don't create new instances per component
   - Handle client cleanup properly

2. Real-time Subscriptions
   ```typescript
   // Always add cleanup
   useEffect(() => {
     let mounted = true
     const channel = supabase.channel('...')
     
     // Check mounted state in callbacks
     if (mounted) {
       // Handle updates
     }

     return () => {
       mounted = false
       supabase.removeChannel(channel)
     }
   }, [])
   ```

## State Management

1. Component State
   - Add proper loading states
   - Handle async operations safely
   - Add mounted checks for updates
   - Clean up state on unmount

2. Navigation
   - Use router for normal navigation
   - Use window.location.href for auth redirects
   - Clean up subscriptions before navigation
   - Handle back button properly

## Error Handling

1. Auth Errors
   - Handle initialization errors
   - Handle session errors
   - Handle sign out errors
   - Provide user feedback via toasts

2. Data Errors
   - Handle query errors
   - Handle subscription errors
   - Add proper error boundaries
   - Log errors for debugging

## Best Practices

1. Session Handling
   - Use getSession() for initial check
   - Listen to auth state changes
   - Handle token refresh events
   - Clean up subscriptions

2. Data Fetching
   - Add proper type safety
   - Use single() for unique queries
   - Add proper error handling
   - Transform data as needed

3. Real-time Updates
   - Add proper subscription cleanup
   - Handle connection status
   - Check mounted state
   - Handle event types properly

4. Navigation
   - Clean up before navigation
   - Handle auth redirects properly
   - Maintain state during navigation
   - Handle back button events

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