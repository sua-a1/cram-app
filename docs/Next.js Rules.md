
1. Project Structure  
 - Keep your code organized by functionality (e.g., grouping related components and pages).
 - Use the “app” directory (in Next.js 13+) or “pages” directory (in earlier versions) as the canonical structure for routes.
 - Isolate UI elements into separate component files for modularity and reuse.

 2. Data Fetching
- In Next.js 13+, use server components for data-fetching where possible. This ensures better performance and smaller client bundles.
- 2.1 Identify Fetch Strategy Based on Data Freshness
    - Use Static Site Generation (SSG) if data doesn’t change often and can be statically generated at build time.
    - Use Server-Side Rendering (SSR) when data must be retrieved on every request (e.g., authenticated user data).
    - Use Client-Side Fetching (CSR) when rendering dynamic or user-specific data after initial page load.
- 2.2 Server Components vs. Client Components (Next.js 13+)
    - Mark a component with "use client" only if it requires interactivity or browser APIs.
    - Use Server Components to perform data-fetching on the server for better performance and smaller client bundles.
- 2.3 Using “getStaticProps” (Next.js pre-13) or “generateStaticParams” (Next.js 13+)
    - For SSG, export getStaticProps/generateStaticParams to provide data to your pages.
    - Always include a fallback or revalidate configuration (in pre-13, use “revalidate”; in 13+, use “revalidateTag” or “revalidatePath”) to keep static data fresh without rebuilding the entire site.
- 2.4 Using “getServerSideProps” (Next.js pre-13) or “Server Components” (Next.js 13+)
    - Preferred for SSR if data can’t be stale at all and must be loaded for each request.
    - Separate business logic (e.g., database queries) into dedicated modules to keep the “getServerSideProps” clean and focused on data retrieval.
    - For Next.js 13, move logic into server components or a dedicated function that fetches data in the server environment.
    - Use the “use client” directive sparingly—only for components that need interactivity or browser APIs.

3. Data Rendering Guidelines
-3.1 Pure & Declarative Components
    - Keep React components pure if possible, aiming to minimize side effects in rendering logic.
    - Use descriptive, functional component names and rely on hooks for state management.
-3.2 Avoid Overfetching
    - Carefully compartmentalize data retrieval to only fetch what’s needed for each route or component.
    - Use context or global state (Redux, Zustand, React Context, etc.) sparingly for data that’s truly shared across multiple components.
-3.3 Page Layouts & Shared Components
    - In Next.js 13, use layout.js files in the “app” directory to define shared UIs or wrappers around child routes.
    - Extract repeated UI (e.g., navbars, footers) into separate components or a higher-order layout.
-3.4 Responsiveness & Styling
    - Leverage Tailwind CSS utility classes for rapid and consistent styling.
    - Use existing components from Shadcn UI and Radix UI instead of reinventing common UI patterns.

4. Routing Best Practices
-4.1 File-Based Routing
    - Organize routes in the “app” directory (in Next.js 13) or “pages” directory (in earlier versions).
    - Use deeply nested folders in “app” when you want nested layouts or multiple levels of route grouping.
-4.2 Dynamic Routes
    - In Next.js 13, create folders like “[id]” or “[slug]” in “app” to handle dynamic paths.
    - In Next.js pre-13, create dynamic filenames ([id].js). Populate the dynamic routes via getStaticPaths (SSG) or getServerSideProps (SSR) for the correct data.
-4.3 Routing & Navigation
    - Use Next.js “Link” from “next/link” for navigation.
    - Take advantage of Next.js prefetching: internal links load in the background for smoother transitions.
-4.4 Layouts & Shared State
    - In Next.js 13, use “layout.js” at each directory level to nest multiple shared layouts.
    - Keep layout logic minimal—avoid large data-fetching blocks in layouts; only fetch data that truly all descendants require.
-4.5 Handling 404 & Custom Errors
    - Use “notFound()” or “redirect()” in Next.js 13+ for error states.
    - Provide meaningful custom 404 pages in the “app” or “pages” directory and handle known errors gracefully.

5. TypeScript Integration
- Leverage the built-in TypeScript support to type responses, props, and component states.
- Maintain strict type definitions for data fetching (e.g., for “getServerSideProps” or “getStaticProps”) to ensure correctness.
- Use descriptive variable names and rely on TypeScript’s inference wherever helpful.

6. Environment Variables & Configuration
- Store sensitive data (API keys, tokens) in environment variables (e.g., .env.local) and never commit them to version control.
- Use process.env only on the server side, or carefully expose safe variables to the client via Next.js configuration patterns.

7. Performance & Best Practices
- Take advantage of Next.js “Image” component for optimized images, which includes automatic resizing, lazy loading, and modern image formats.
- Use Next.js built-in SEO features (e.g., “Head” component from next/head or the new Metadata API in Next.js 13) to define meta tags.
- Implement caching headers and consider incremental static regeneration (ISR) for frequent data updates without full redeploys.

8. Styling & UI Libraries
- Integrate Tailwind CSS for consistent and responsive styling.
- Leverage Radix UI and Shadcn UI for common UI elements instead of re-inventing custom components.
- Compose utility classes for clarity, and avoid deeply nested custom CSS when built-in patterns or utility classes suffice.

9. Code Quality & Conventions
- Follow a functional and declarative style in components to reduce complexity.
- Prefer iteration and modular functions over repeating logic across components.
- Be mindful of concurrency and side effects; keep them encapsulated in dedicated hooks or server utilities.
- Use concise conditionals: for simple returns, omit braces and inline them.

