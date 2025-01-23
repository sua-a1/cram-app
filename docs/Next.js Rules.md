# Next.js Rules (Concise & Actionable)

References:  
• [@docs/SupabaseIntegrationRules.md](#) for Supabase-specific practices.

---

## 1. Project Structure
• Use Next.js 13 “app” directory for routing.  
• Group related components/pages by feature.  
• Isolate UI elements into separate files to encourage modular reuse.

---

## 2. Data Fetching
• Use server components for data retrieval (better performance).  
• Only “use client” if a component needs browser APIs or interactivity.  
• SSG (Static Generation) for rarely changed data, SSR (Server-Side Rendering) for fresh data on each request, CSR (Client) for dynamic user-based changes.

---

## 3. Supabase Integration
• Refer to [@docs/SupabaseIntegrationRules.md](#) for PKCE auth and SSR.  
• Keep server-side operations (RLS queries, admin tasks) in server components or route handlers.  
• Never expose sensitive keys in client code.

---

## 4. Routing & Code Quality
• For dynamic routes, use “[id]” or “[slug]” folders.  
• Use next/link for navigation; take advantage of prefetching.  
• Minimize overfetching: retrieve only needed data.  
• Maintain functional, type-safe TS with descriptive variable names.

---

## 5. Styling & UI
• Stick to Tailwind CSS, Shadcn UI, and Radix UI; avoid reinventing common patterns.  
• Keep design responsive and minimal in layout.tsx or layout.js.  
• For advanced user interaction, limit “use client” to truly interactive components.

---

## 6. Environment & Performance
• Store secrets in .env, never commit them.  
• Use Next.js “Image” (or built-in optimization) for images.  
• Use incremental static regeneration (ISR) or revalidation for frequently updated pages instead of full rebuilds.

---

## 7. Edge Functions
• Use Next.js Edge Middleware or Supabase Edge Functions sparingly for near-user tasks.  
• Note edge runtime limitations (no fs, minimal net).  
• Keep secrets or heavy logic on the server.

