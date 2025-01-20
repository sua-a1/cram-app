
## 1. App Architecture Overview

• We will use Next.js 13’s “app” directory.
• Server Components for most data fetching and Supabase operations.
• Client Components only for browser interactions (e.g., form submission, UI state).
• Supabase Integration (service role keys on the server side, minimal real-time client usage where needed).
• Tailwind, Shadcn UI, Radix UI for styling and ready-made components (avoid custom ones if a library pattern suffices).
Project Folder Structure (High-Level)
(Example, can be adapted as we go)
app/
├─ admin/
│ ├─ layout.tsx
│ ├─ page.tsx ← main admin interface
│ └─ server-actions.ts (any server-side logic specific to admin)
├─ employee/
│ ├─ layout.tsx
│ ├─ page.tsx ← employee queue / ticket handling
│ └─ server-actions.ts
├─ tickets/
│ ├─ [id].tsx ← ticket detail page
│ ├─ page.tsx ← listing or summary of tickets
│ └─ server-actions.ts
├─ api/
│ └─ route.ts (could house global or supplemental API routes)
├─ components/ (shared UI components)
├─ lib/ (common utilities, supabase client, domain logic)
└─ hooks/ (shared React hooks if needed)
We will also have the following relevant directories:
• /types – shared interfaces (Ticket, User, etc.)
• /docs – PRD, workflow docs (like “AI Workflow Overview.md,” “ROADMAP.md”), checklists, sessions logs, etc.
---
2. API Routes & Data Flows
With Next.js 13, we can leverage Route Handlers in the “app/api/…” folder or define server-action functions in each feature subfolder. For instance:
Tickets
– (GET) /api/tickets – Retrieve list of tickets
– (POST) /api/tickets – Create a new ticket
– (GET) /api/tickets/[id] – Retrieve a single ticket
– (PUT) /api/tickets/[id] – Update ticket status, priority, or fields
– (DELETE) /api/tickets/[id] – (Optional, or archive)
Employees
– (GET) /api/employees – Retrieve list of employees or teams
– (POST) /api/employees – Create a new employee profile (or invite user)
Admin
– (GET) /api/admin/teams – Manage team listing, or basic routing definitions
– (POST) /api/admin/teams – Create or modify a team, etc.
Depending on the complexity, you might keep it simpler by using a single “/api/route.ts” that branches logic based on request parameters. Alternatively, you can place domain-specific routes in each subfolder.
We’ll keep common server logic in “server-actions.ts” or “lib/server/tickets-logic.ts,” so the same logic can be shared by pages, hooks, and direct route handlers. The key is to centralize domain rules in one place (the so-called “mega file” approach) for easy AI scanning and clarity.
---
3. Development Order
Although the final product includes all three views (Employees, Admins, Customers), we’ll focus on them in this rough order:
Employee View & Functionalities
Develop the main queue listing page and basic ticket actions (open, close, reassign, internal notes).
Ensure we have the core Ticket data model, RLS rules, and basic Supabase integration in place.
Create minimal API endpoints (or server-actions) so employees can view and update tickets.
Admin View & Functionalities
Implement team creation and assignment.
Add basic routing logic (if “billing” in subject, route to “Billing Team”).
Provide an Admin panel to track system-wide data (all tickets, user management).
Customer View & Functionalities
Build ticket creation, tracking, and a minimal knowledge base or help center.
Ensure secure authentication so customers see only their tickets.
Provide a simplified interface for updating or closing tickets.
Once the MVP is stable, we can iterate with advanced features (e.g., AI-based routing, analytics dashboards, self-service expansions).
---
4. Next Steps
• Finalize the schema for Tickets, ensuring we handle states (open, in-progress, closed, etc.), priority, tags, internal notes, and conversation history.
• Build out the “employee” subdirectory structure (layout, pages, server-actions). Start with listing tickets, viewing details, and updating statuses.
• Set up the “admin” pages for user/team management.
• After these two roles are functional, structure the “customer” area for ticket creation, tracking, and possibly a knowledge base placeholder.
Keep refining or expanding the app’s route definitions as new needs arise. Always remember to store any large domain logic in a single location (like “tickets-logic.ts”) for easy reference and AI maintainability.
---
That’s the broad overview. As we proceed, we’ll keep referencing:
• .cursorrules
• docs/prd.md
• docs/nextjs-rules.md
• docs/techstack-rules.md
• docs/ui-rules.md
for consistent code organization, user interface patterns, and workflow best practices.
Is there anything else we should consider integrating? e.g. would Zustand stores be relevant/useful when using Supabase already? What about rate limiting considerations, edge function best practices, etc? 

What is langchain, what does it do, what is it used for

LangChain is an open-source framework designed to help developers build applications powered by Large Language Models (LLMs) more effectively. It provides a structured way to chain various steps of a language-based process—such as prompt management, memory/state persistence, and interaction with external APIs—into coherent “pipelines.”
Below is an overview of what LangChain is and why it’s commonly used:
Purpose and Core Concept:
• LangChain helps you create “chains” of operations involving LLMs (e.g., GPT-4, etc.).
• Each chain can manage data in specific ways—for instance, retrieving data from a knowledge base, transforming it via a language model, then returning a final output.
• By breaking down the steps into modules, developers can more easily maintain, iterate, and test the logic of their LLM-based solutions.
Key Features:
• Prompt Management: Lets you version, structure, and dynamically build prompts.
• Chains and Pipelines: Encourages a modular approach to complex tasks (e.g., reading from a database, summarizing text via an LLM, sending the result to another service).
• Memory Components: Keeps track of conversation history or context throughout multiple turns, enabling stateful interactions.
• Tooling and Integrations: Provides built-in support for third-party APIs, vector stores (e.g., Pinecone, Weaviate), and custom data sources.
• Agents and Action Plans: Some LangChain features let the LLM itself decide which tool or task to invoke next, based on user queries or instructions.
Common Use Cases:
• Chatbots and Conversational Agents: Building a chatbot that maintains context and interacts with external APIs for extra data (like knowledge bases or CRMs).
• Question Answering over Documents: Querying large datasets (PDFs, knowledge articles, etc.) by combining retrieval from a vector database with a language model’s ability to summarize or extract info.
• Workflow Automation with LLMs: Automating tasks such as text generation, summarization, translation, or classification.
• Interactive Agents or “AI Assistants”: Allowing an LLM to decide which tool or step to use next (e.g., searching the web, executing code) within a controlled environment.
Overall, LangChain simplifies the process of combining large language models with external data and advanced workflows, providing a structured framework for developers to iterate quickly and reliably on AI-driven applications. It’s popular for building end-to-end solutions—from straightforward Q&A bots to more advanced “agentic” systems—because it abstracts away many of the repetitive scaffolding tasks, letting developers focus on their specific problem rather than the underlying LLM complexity.


