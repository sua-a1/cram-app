import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgSignUpForm } from '@/components/org/signup-form';
import { ToastProvider } from '../mocks/toast-provider';
import { signUpAction } from '@/app/org/(routes)/org-auth/signup/actions';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: () => null,
    };
  },
}));

// Mock toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock signup action
jest.mock('@/app/org/(routes)/org-auth/signup/actions', () => ({
  signUpAction: jest.fn(),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
}

describe('Organization Signup Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render signup form with all fields', () => {
    renderWithProviders(<OrgSignUpForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /role/i })).toBeInTheDocument();
  });

  it('should handle successful signup', async () => {
    const mockSignupResponse = {
      success: true,
      message: 'Please check your email for verification.',
    };
    (signUpAction as jest.Mock).mockResolvedValueOnce(mockSignupResponse);

    const user = userEvent.setup();
    const { container } = renderWithProviders(<OrgSignUpForm />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/display name/i), 'Test User');
    await user.type(screen.getByLabelText(/^password$/i), 'Test123!@#');
    await user.type(screen.getByLabelText(/confirm password/i), 'Test123!@#');
    
    // Set role value directly in the hidden select
    const hiddenSelect = container.querySelector('select[aria-hidden="true"]') as HTMLSelectElement;
    if (hiddenSelect) {
      hiddenSelect.value = 'admin';
      fireEvent.change(hiddenSelect);
    }

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Verify form submission
    await waitFor(() => {
      expect(signUpAction).toHaveBeenCalled();
      const formData = (signUpAction as jest.Mock).mock.calls[0][0];
      expect(formData.get('email')).toBe('test@example.com');
      expect(formData.get('displayName')).toBe('Test User');
      expect(formData.get('password')).toBeTruthy();
      expect(formData.get('role')).toBe('admin');
    });

    // Check success toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: mockSignupResponse.message,
      });
    });
  });

  it('should handle validation errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrgSignUpForm />);

    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Check validation messages
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/^password must be at least 8 characters$/i)).toBeInTheDocument();
      expect(screen.getByText(/display name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('should handle password mismatch', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrgSignUpForm />);

    // Fill form with mismatched passwords
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/display name/i), 'Test User');
    await user.type(screen.getByLabelText(/^password$/i), 'Test123!@#');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass123!@#');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('should handle signup error', async () => {
    const mockError = 'Email already exists';
    (signUpAction as jest.Mock).mockResolvedValueOnce({ error: mockError });

    const user = userEvent.setup();
    const { container } = renderWithProviders(<OrgSignUpForm />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/display name/i), 'Test User');
    await user.type(screen.getByLabelText(/^password$/i), 'Test123!@#');
    await user.type(screen.getByLabelText(/confirm password/i), 'Test123!@#');
    
    // Set role value directly in the hidden select
    const hiddenSelect = container.querySelector('select[aria-hidden="true"]') as HTMLSelectElement;
    if (hiddenSelect) {
      hiddenSelect.value = 'admin';
      fireEvent.change(hiddenSelect);
    }

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Check error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: mockError,
      });
    });
  });
}); 
