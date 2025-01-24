import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { createClient } from '@supabase/supabase-js';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
})); 