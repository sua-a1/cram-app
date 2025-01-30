import '@testing-library/jest-dom/vitest';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock next/navigation globally
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    };
  },
  useSearchParams() {
    return {
      get: () => null,
    };
  },
  usePathname() {
    return '/';
  },
})); 
