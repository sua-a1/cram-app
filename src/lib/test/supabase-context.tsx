import React, { createContext, useContext } from 'react';

export type MockSupabaseClient = {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
      data: { user: null; session: null } | null;
      error: null | { message: string };
    }>;
  };
};

const mockClient: MockSupabaseClient = {
  auth: {
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: null,
    }),
  },
};

const SupabaseContext = createContext<MockSupabaseClient>(mockClient);

export const useSupabaseClient = () => useContext(SupabaseContext);

export const MockSupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SupabaseContext.Provider value={mockClient}>
      {children}
    </SupabaseContext.Provider>
  );
}; 
