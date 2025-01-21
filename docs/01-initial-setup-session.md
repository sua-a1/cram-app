# Initial Setup Session Log

## Recent Updates (Latest First)

### Code Fixes and Type Improvements
- Fixed type conflicts in `tickets-logic.ts`
  - Removed duplicate `Ticket` type import
  - Updated schema-aligned types using Supabase database types
  - Fixed `userId` to `user_id` to match database schema
  - Implemented basic ticket validation logic

### UI Components
- Added Shadcn UI toast component for notifications
  - Installed using `npx shadcn@latest add toast`
  - Created files:
    - `src/components/ui/toast.tsx`
    - `src/components/ui/toaster.tsx`
  - Updated `src/hooks/use-toast.ts`

### Database and Security
- Implemented comprehensive RLS policies for CRUD operations:
  - **Profiles**
    - Users can read and update their own profiles
    - Users cannot change their role
    - Admins can update any profile, including roles
    - Create/Delete managed by auth hooks
  
  - **Teams**
    - All authenticated users can read
    - Admin-only for Create/Update/Delete
  
  - **Tickets**
    - Create: Any authenticated user
    - Read: Ticket creator, assigned employee, admins
    - Update: Based on role and ticket status
    - Delete: Admin only, with status conditions
  
  - **Ticket Messages**
    - Create: Any authenticated user on accessible tickets
    - Read: Same as ticket access
    - Update: Message author within time limit
    - Delete: Admin only or author within time limit
  
  - **Knowledge Base**
    - Read: All authenticated users
    - Create/Update/Delete: Admin only 