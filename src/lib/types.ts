import { Database } from './database.types';

export type Ticket = Database['public']['Tables']['tickets']['Row'];

export interface CustomerTicketListProps {
  tickets: Ticket[];
} 