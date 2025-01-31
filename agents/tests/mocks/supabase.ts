import { createClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

// Mock data
const mockTickets = new Map();
const mockEmbeddings = new Map();
const mockProfiles = new Map();

// Create a mock Supabase client
export const mockSupabaseClient = {
  auth: {
    admin: {
      createUser: vi.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
      deleteUser: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  data: null,
  error: null,
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }),
};

// Mock the createClient function
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Export for use in tests
export { createClient }; 
