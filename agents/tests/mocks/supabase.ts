import { vi } from 'vitest';

// Mock data
const mockTickets = new Map();
const mockEmbeddings = new Map();
const mockProfiles = new Map();

const mockSupabaseClient = {
  auth: {
    admin: {
      createUser: vi.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
      deleteUser: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
  from: (table: string) => ({
    insert: vi.fn().mockImplementation((data) => {
      if (table === 'tickets') {
        const tickets = Array.isArray(data) ? data : [data];
        tickets.forEach(ticket => {
          mockTickets.set(ticket.id, {
            ...ticket,
            assigned_team: { name: 'Test Team' },
            creator: { display_name: 'Test Creator' },
            assignee: { display_name: 'Test Assignee' },
          });
        });
        return {
          select: () => ({
            single: () => ({ 
              data: mockTickets.get(tickets[0].id), 
              error: null 
            }),
          }),
        };
      }
      return { data: null, error: null };
    }),
    upsert: vi.fn().mockImplementation((data) => {
      if (table === 'ticket_context_embeddings') {
        mockEmbeddings.set(data.ticket_id, data);
      }
      if (table === 'profiles') {
        mockProfiles.set(data.user_id, data);
      }
      return { error: null };
    }),
    delete: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockImplementation((columns) => ({
      single: () => {
        if (table === 'tickets') {
          return { data: Array.from(mockTickets.values())[0], error: null };
        }
        return { data: null, error: null };
      },
      eq: (field: string, value: any) => ({
        data: table === 'tickets' ? mockTickets.get(value) : 
              table === 'ticket_context_embeddings' ? mockEmbeddings.get(value) : null,
        error: null,
        single: () => ({
          data: table === 'tickets' ? mockTickets.get(value) : 
                table === 'ticket_context_embeddings' ? mockEmbeddings.get(value) : null,
          error: null
        })
      }),
      in: (field: string, values: any[]) => ({
        data: values.map(v => {
          if (table === 'ticket_context_embeddings') {
            return mockEmbeddings.get(v);
          }
          if (table === 'tickets') {
            return mockTickets.get(v);
          }
          return null;
        }).filter(Boolean),
        error: null
      }),
      data: table === 'tickets' ? Array.from(mockTickets.values()) : [],
      error: null,
    })),
  }),
  rpc: vi.fn().mockImplementation((func, params) => {
    if (func === 'match_tickets') {
      // Return some mock similar tickets with similarity scores
      const similarTickets = Array.from(mockTickets.values())
        .map(ticket => ({
          ticket_id: ticket.id,
          similarity: 0.9,
          ...ticket,
        }))
        .slice(0, params.match_count);
      return {
        data: similarTickets,
        error: null,
      };
    }
    return { data: null, error: null };
  }),
};

// Mock the createClient function
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabaseClient),
}));

// Export for use in tests
export { mockSupabaseClient }; 
