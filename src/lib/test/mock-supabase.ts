type MockAuthClient = {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
      data: { user: any; session: any } | null;
      error: null | { message: string };
    }>;
  };
};

const mockUser = {
  id: '1',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
};

const mockSession = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockUser,
};

export const mockSupabaseClient: MockAuthClient = {
  auth: {
    signInWithPassword: async () => ({
      data: {
        user: mockUser,
        session: mockSession,
      },
      error: null,
    }),
  },
};

export const createMockClient = () => mockSupabaseClient; 
