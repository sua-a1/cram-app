#   Project Requirements Document (PRD)  
for “Cram” – A Modern AI-Driven Customer Support System

## 1. Overview  

Cram is a customer support platform integrated with AI capabilities. It draws inspiration from modern CRMs and ticketing systems, aiming to automate and streamline support tasks. The core functionalities target ticket management, automation, and a robust API-first design—all built on Next.js and Supabase.

---

## 2. Objectives & Scope  

• Build an MVP that covers critical customer support workflows:  
  – Ticket submission and tracking for customers.  
  – Centralized queue management and ticket resolution for employees.  
  – Team management and workflow configuration for admins.

• Provide an extensible environment for future AI augmentations, such as automated ticket routing and LLM-based response suggestions.

### Development Priority (High-Level)
While the final system will include the complete feature set described in “docs/App Description.md,” our near-term implementation will focus on:  
1. Employee View & Functionalities (Queue management, ticket handling, performance tools)  
2. Admin View & Functionalities (Team creation, role management, basic routing)  
3. Customer View & Functionalities (Ticket creation and tracking portal)

This order is not strict and may change slightly as development evolves, but it reflects our initial plan for building out interfaces and features.

---

## 3. Key Features  

### 3.1 Ticket Management

1. Ticket Data Model  
   – Standard Identifiers & Timestamps: Each ticket has a unique ID, creation/update timestamps.  
   – Status & Priority: Basic fields to track the ticket’s progress (e.g., open, in-progress, closed) and priority (low, medium, high).  
   – Custom Fields & Tags: Allows flexible tagging or categorization for workflow automations.  
   – Conversation History: All interactions (messages, status changes, internal notes) are retained in the ticket record.

2. Ticket Workflows  
   – Dynamic Status Tracking: Based on team workflows (e.g., open → in-progress → escalated → resolved).  
   – Bulk Operations: Update multiple tickets at once for common actions.  
   – Internal Notes: Employees and teams can collaborate behind-the-scenes, without exposing notes to customers.

### 3.2 Customer Portal

1. Ticket Creation & Tracking  
   – Users (customers) can view, create, and update support tickets.  
   – Secure Login via Supabase Auth to ensure ticket privacy.

2. Self-Service Tools (Minimal MVP)  
   – Basic Knowledge Base or help articles. (Optional MVP: Placeholder)  

3. Communication Channels  
   – Customers can interact through the web interface (potential for email or chat integration in future enhancements).

### 3.3 Employee Interface

1. Queue Management  
   – Real-time updates of ticket changes.  
   – Filtering by ticket state (open, in-progress, etc.) or priority.  
   – Individual and team-level ticket assignment.

2. Ticket Handling  
   – Detailed view of customer history.  
   – Rich Text Editing or minimal text editing for responses.  
   – Macros or templates for frequently used replies (MVP can be simple stored text snippets).

3. Performance Tools (Minimal MVP)  
   – Basic metrics (e.g., number of tickets closed, average resolution time).  
   – Expandable in the future for advanced analytics.

### 3.4 Administrative Control

1. Team & Role Management  
   – Admins can create teams with specific focus areas.  
   – Assign employees to teams based on skill sets.  
   – Manage coverage schedules.  

2. Routing Intelligence (MVP Scope)  
   – Basic rule-based ticket assignment (e.g., if “billing” in ticket subject, route to “Billing Team”).  
   – Future expansions: AI-based routing or advanced skill matching.

3. Data Management & Configuration  
   – Ability to add or remove custom fields and tags.  
   – Basic auditing logs for ticket changes within Supabase’s row-level security (RLS) framework.  
   – Clear separation of environment variables and secrets.

---

## 4. System Architecture  

### 4.1 Technology Stack

• Frontend & Rendering:  
  – Next.js 13+ for SSR, SSG, and server components.  
  – TypeScript for strict type safety.  
  – Tailwind CSS, Radix UI, and Shadcn UI for fast and consistent styling.

• Backend & Database:  
  – Supabase for database, auth, storage, and real-time capabilities (leveraging PostgreSQL).  
  – Potential Edge Functions or server components for logic that must run server-side.

### 4.2 API-First Design

• REST + Edge Endpoints in Next.js: Provide APIs for ticket CRUD, status updates, tagging, etc.  
• Supabase Edge Functions (Optional MVP) for advanced server-side tasks like AI routing or automated escalations.  
• Authentication & Security:  
  – Supabase Auth.  
  – Granular row-level security for restricting ticket visibility (customers see only their own tickets, employees see assigned or allowed tickets, admins see all).

### 4.3 Data Flow

• Customer creates ticket → Supabase stores record → CRAM routes it or places it in a queue → Employee picks or is assigned a ticket → All interactions logged in the ticket conversation history.  
• Admins manage team assignments and route rules → employees automatically see appropriate tickets in their queue.

---

## 5. User Roles & Workflows  

### 5.1 Customers

• Sign up / log in to the system (Supabase Auth).  
• Create/view/update tickets from a “My Tickets” page.  
• Optionally search or browse knowledge base articles (basic version for MVP).  
• Receive email notifications (future enhancement).

### 5.2 Employees (Support Agents)

• View assigned tickets in a unified queue.  
• Update statuses, add internal notes, respond to customers.  
• Filter/sort tickets by priority, tags, or status.  
• Possibly reassign or escalate tickets to specialized teams (with admin or lead privileges).

### 5.3 Admins

• Oversee entire system: all tickets, all employees, all teams.  
• Configure new teams, fields, or advanced rules.  
• Manage escalations, closures, or bulk ticket operations.  
• Access limited analytics for performance tracking (MVP: basic metrics/trends).

---

## 6. MVP Deliverables  

• Basic Customer Portal (ticket creation/tracking, simple knowledge base placeholder).  
• Employee Interface (queue, ticket detail view, status update, limited analytics).  
• Admin Tools (team creation, user management, basic routing rules).  
• Core Ticket Data Model in Supabase (with RLS for security).  

---

## 7. Code Organization Strategy (AI-Optimized)

Below is a proposed structure that maximizes context for AI-based code maintenance while preserving a logical flow for developers:

1. Monolithic Folder Approach in Next.js “app” Directory  
   – Consolidate front-end pages, server components, and minimal API routes in a single /app folder.  
   – Subfolders for each major feature:  
     /app/tickets  
     /app/admin  
     /app/auth  
     /app/knowledge-base  
   – Each folder houses its pages (e.g., page.tsx for listing, [id].tsx for details), plus relevant server-side functions (e.g., server-actions.ts).

2. Shared “lib” & “types” Directories  
   – /lib for reusable server utilities (e.g., Supabase client, RLS queries, AI routing stubs).  
   – /types for shared TypeScript interfaces (Ticket, User, etc.) that both server and client code can import.

3. Single Large “Mega File” for Domain Logic (Optional with AI Agents)  
   – In an AI context, having a single file called tickets-logic.ts or domain-logic.ts can hold crucial ticketing logic: status transitions, rules, validation. This reduces the overhead of referencing multiple files for an AI agent.  
   – Smaller files can import partial utility code from the “mega file” if needed.

4. Components & Hooks  
   – Keep UI components (like forms, layout elements) in /app/components or in each feature folder’s local components directory.  
   – Use custom hooks for higher-level client logic, such as useFetchTickets or useUpdateTicket. Place them in the same feature folder or a shared /app/hooks folder.

5. Edge Functions (If used) in /supabase/functions (or Next.js route handlers)  
   – Keep them minimal and specialized. Offload heavier logic to server components or the “mega file” in /lib if possible, so the edge function does minimal overhead tasks.

6. Naming & Conventions  
   – Keep function and variable names descriptive, focusing on single-responsibility parts.  
   – Use a consistent naming pattern for page, layout, or server/route handler files (e.g., route.ts, layout.tsx).  
   – Maintain “use client” directives at the top of UI/interactive files to keep them separate from server logic.

By following this structure, future AI-driven modifications or expansions can easily locate relevant contexts. The large domain-logic file strategy helps an AI agent see the entire ticketing logic in one place—trading off some human readability for AI-friendliness.

---

## 8. Future Enhancements (Beyond MVP)

• AI-Routing & Automated Responses:  
  – Use an AI agent to auto-respond to common requests, escalate complex tickets, and refine resolution times.  
• Advanced Reporting & Dashboards:  
  – Employee performance metrics, team workloads, SLA management.  
• Multi-Channel & Multi-Lingual Support:  
  – Chatbots, phone integrations, support for multiple languages.  
• Self-Service Portal Upgrades:  
  – Enhanced knowledge base with advanced search, guided solutions.

---

## 9. Success Criteria

1. Usability  
   – Customers can sign up, file tickets, and see updates in real time with minimal friction.  
   – Employees can manage tickets effectively, track status, collaborate with teams.  

2. Scalability & Performance  
   – Supabase & Next.js handle concurrency for typical support volumes.  
   – Real-time updates flow seamlessly to both customers and employees.

3. Security & Data Integrity  
   – RLS ensures tickets and data remain private to the relevant user, team, or role.  
   – Environment variables for sensitive keys remain on the server side.

4. Extensibility  
   – Project structure easily accommodates future AI modules or integration with third-party tools.  
   – Additional features can be added without disrupting existing core flows.

---

## 10. Conclusion

The Cram MVP aims to deliver a functional, modern customer support system built with Next.js, Supabase, and a strong emphasis on AI-readiness. By focusing on well-defined data models, modular code organization, and the fundamental ticketing workflows, this PRD ensures a stable foundation for iterative enhancements—leading to a fully automated, AI-driven CRM solution in subsequent phases.
