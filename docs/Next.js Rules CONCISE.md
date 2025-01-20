# AI-Friendly Next.js Best Practices

## 1. Project Structure
- Keep code organized by functionality and feature.  
- For Next.js 13+, use the “app” directory as your primary route structure.  
- Group UI elements into separate component files for reusability.

## 2. Data Fetching
- Decide on SSG (Static Site Generation), SSR (Server-Side Rendering), or CSR (Client-Side Rendering) based on data freshness needs.  
- In Next.js 13+, prefer server components for data-fetching to reduce client bundle size.  
- Use “use client” only when interactivity or browser APIs are required.

## 3. Data Rendering
- Keep components pure and declarative.  
- Minimize overfetching by fetching data only where needed.  
- Utilize layouts (layout.js) for shared UIs like navbars and footers.

## 4. Routing
- Use the “app” directory (Next.js 13) for file-based routing and nested layouts.  
- Dynamically route with “[param]” folders.  
- Employ Next.js “Link” for native client-side transitions and prefetching.

## 5. TypeScript Integration
- Enable strict mode for type safety.  
- Type props, server responses, and application states clearly.  
- Use descriptive variable and function names for better readability.

## 6. Environment Variables & Config
- Store sensitive data in environment variables (e.g., .env.local).  
- Expose only safe variables via NEXT_PUBLIC_ prefix on the client.  
- Avoid committing credentials or secrets to version control.

## 7. Performance & Best Practices
- Use Next.js “Image” for automatic image optimization and lazy loading.  
- Configure meta tags or use the Metadata API for SEO (Next.js 13).  
- Consider caching and incremental static regeneration for dynamic data.

## 8. Styling & UI
- Use Tailwind CSS for fast, responsive styling.  
- Favor Radix UI and Shadcn UI components over custom-built ones.  
- Keep styling minimal and composable with utility classes.

## 9. Code Quality & Conventions
- Write functional, declarative components.  
- Keep concurrency and side effects isolated in hooks or server utilities.  
- Lint, format, and type-check (tsc) in a continuous integration workflow.

---