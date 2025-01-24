# Customer Notifications Implementation Checklist

## Overview
Implement real-time notifications for customers about their ticket updates:
- Status changes
- New messages from organization staff
- Unread notification count
- Dropdown menu for viewing notifications
- Deep linking to specific tickets/messages

## 1. Database Setup
- [x] Create notifications table in Supabase:
  ```sql
  CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id),
    ticket_id uuid NOT NULL REFERENCES public.tickets(id),
    type text NOT NULL CHECK (type IN ('status_update', 'new_message')),
    message text NOT NULL,
    read boolean DEFAULT false,
    message_id uuid REFERENCES public.ticket_messages(id),
    created_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
  );
  ```
- [x] Add appropriate RLS policies for notifications
- [x] Create indexes for performance:
  ```sql
  CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
  CREATE INDEX idx_notifications_read ON public.notifications(read);
  CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
  ```

## 2. Database Triggers
- [x] Create trigger for ticket status changes:
  - Trigger on ticket table updates
  - Insert notification for status changes
- [x] Create trigger for new messages:
  - Trigger on ticket_messages table inserts
  - Only create notification if message author is not the recipient

## 3. Types and Server Logic
- [x] Add notification types to /types/index.ts
- [x] Create notification service in /lib/server/notifications.ts:
  - Function to fetch user notifications
  - Function to mark notifications as read
  - Function to delete old notifications

## 4. UI Components
- [x] Create NotificationBell component using Shadcn:
  - Use Dropdown Menu component
  - Add Badge component for unread count
  - Style with Tailwind CSS
- [x] Create NotificationItem component:
  - Different styles for status updates vs new messages
  - Timestamp display
  - Click handling for navigation

## 5. Real-time Updates
- [x] Set up Supabase real-time subscription for notifications:
  - Subscribe to notifications table changes
  - Update notification count badge
  - Show toast for new notifications

## 6. Navigation & Deep Linking
- [x] Implement click handlers for notifications:
  - Status updates: Navigate to ticket page
  - New messages: Navigate to specific message
  - Mark as read on click

## 7. State Management
- [x] Create notifications context/store:
  - Track unread count
  - Cache recent notifications
  - Handle real-time updates
- [x] Implement mark-as-read functionality

## 8. Integration
- [x] Update customer layout.tsx:
  - Replace "Notifications go here" with NotificationBell
  - Add notifications context provider
- [x] Test real-time updates

## 9. Performance & Cleanup
- [ ] Implement pagination for notifications
- [ ] Add cleanup job for old notifications
- [ ] Optimize real-time subscriptions

## 10. Testing & Documentation
- [ ] Test notification flow end-to-end
- [ ] Document notification system
- [ ] Add loading states
- [ ] Handle error cases

## Components to Use
1. Shadcn Components:
   - DropdownMenu
   - Badge (for notification count)
   - ScrollArea (for notification list)
   - Separator
   - Button (for mark all as read)

2. Custom Components:
   - NotificationBell (wrapper for dropdown)
   - NotificationItem (individual notification)
   - NotificationList (scrollable list)

## File Structure
```
src/
  components/
    notifications/
      notification-bell.tsx
      notification-item.tsx
      notification-list.tsx
  lib/
    server/
      notifications.ts
    client/
      use-notifications.ts
  types/
    notifications.ts
```

## Notes
- Use Supabase real-time features for instant updates
- Implement proper cleanup to prevent memory leaks
- Follow Next.js server/client component patterns
- Use proper error handling and loading states
- Follow accessibility guidelines 