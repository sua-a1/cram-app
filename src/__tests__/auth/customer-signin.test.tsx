import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInForm } from '@/components/auth/signin-form';
import { ToastProvider } from '../mocks/toast-provider';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      refresh: vi.fn(),
    };
  },
  useSearchParams() {
    return {
      get: () => null,
    };
  },
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
}

describe('Customer Signin Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render signin form with all fields', () => {
    renderWithProviders(<SignInForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should handle successful signin', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Test123!@#');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify form submission
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Test123!@#',
      });
    });

    // Check success toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Welcome back!',
      });
    });
  });

  it('should handle validation errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);

    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Check validation messages
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should handle signin error', async () => {
    const mockError = { message: 'Something went wrong. Please try again.' };
    mockSignInWithPassword.mockResolvedValueOnce({ error: mockError });

    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Test123!@#');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Check error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: mockError.message,
      });
    });
  });
}); 
