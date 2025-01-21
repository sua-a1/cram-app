# Project Roadmap: Cram App

This roadmap tracks major milestones, tasks, and their statuses for the Cram MVP. Update this file whenever a large feature begins, completes, or changes scope.

---

## 1. Milestones Overview

1. Initial Project Setup  
   - Basic Next.js 13 + Supabase integration.  
   - Tailwind, Radix, Shadcn UI installed and configured.  
   - Project structure aligned with AI-first approach.

2. Organization & Authentication Management
   - Organization registration and management
   - Role-based authentication (Customer, Employee, Admin)
   - Team and department structure
   - Security and access control

3. Core Ticket Management  
   - Creation, Editing, Status changes, Priority handling.  
   - Customer, Employee, and Admin interfaces (basic MVP).  
   - RLS rules in Supabase to secure organization data.

4. Team & Role Management  
   - Organization-specific team management
   - Role-based access control
   - Department and position management
   - Basic routing rules (e.g., "Billing Tickets → Billing Team").

5. MVP Completion  
   - Organization-specific dashboards
   - Basic analytics per organization
   - QA, security checks, and final bug fixes.

6. Future Enhancements (Post-MVP)  
   - AI-based routing  
   - Automated response suggestions  
   - Advanced analytics and time-based reporting
   - Multi-organization support improvements

---

## 2. Current Task List

- [x] (COMPLETE) Initialize Next.js + Supabase Project  
- [x] (COMPLETE) Configure Shadcn UI + Radix + Tailwind  
- [x] (COMPLETE) Implement Customer Authentication Flow
- [ ] (IN PROGRESS) Organization Management System
  - [ ] Organization registration flow
  - [ ] Organization profile management
  - [ ] Domain verification system
  - [ ] Organization settings and configuration
- [ ] (IN PROGRESS) Organization Authentication System
  - [ ] Create org-auth routes and layouts
  - [ ] Implement role-specific registration
  - [ ] Set up approval workflow
  - [ ] Add security measures
- [ ] (PENDING) Build Employee Dashboard
- [ ] (PENDING) Implement Team Management
- [ ] (PENDING) Create Ticket Management System

## 3. Authentication Implementation Details

### Phase 1: Customer Authentication (COMPLETE)
- Basic email/password signup
- Session management
- Password reset flow
- RLS policies for customer data

### Phase 2: Organization Management (IN PROGRESS)
1. Organization Setup
   - Registration flow
   - Profile management
   - Domain verification
   - Settings configuration

2. Organization Structure
   - Department management
   - Team configuration
   - Role hierarchy
   - Position management

### Phase 3: Organization Authentication (IN PROGRESS)
1. Route Structure
   - Set up (org) route group
   - Create role-specific pages
   - Implement approval workflow

2. Registration System
   - Organization selection
   - Role selection
   - Department/team selection
   - Email verification
   - Manager approval flow

3. Security & Validation
   - Domain validation
   - Rate limiting
   - Input sanitization
   - Session management

4. Database & RLS
   - Organization profiles
   - Approval workflow tables
   - Role-specific policies
   - Organization-aware RLS

### Phase 4: Dashboard Implementation (PENDING)
- Organization-specific views
- Employee queue view
- Admin management interface
- Team configuration
- Analytics and reporting

---

## 4. Checklist Reference

For each milestone, create a dedicated checklist in "/docs/checklists" (e.g. /docs/checklists/<MILESTONE-NAME>.md), outlining step-by-step tasks to complete that milestone thoroughly and systematically.

---