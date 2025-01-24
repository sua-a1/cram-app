import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '@/app/org/(routes)/org-auth/register/page';
import * as actions from '@/app/org/(routes)/org-auth/register/actions';
import { ToastProvider } from '../mocks/toast-provider';

// Mock the register action
jest.mock('@/app/org/(routes)/org-auth/register/actions', () => ({
  registerAction: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
}

describe('Registration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render registration form', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText(/register organization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/domain/i)).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    const mockRegisterAction = actions.registerAction as jest.Mock;
    mockRegisterAction.mockResolvedValue({ error: null });

    renderWithProviders(<RegisterPage />);
    
    fireEvent.change(screen.getByLabelText(/organization name/i), {
      target: { value: 'Test Org' },
    });
    fireEvent.change(screen.getByLabelText(/domain/i), {
      target: { value: 'test.com' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create organization/i }));

    await waitFor(() => {
      expect(mockRegisterAction).toHaveBeenCalled();
      const formData = mockRegisterAction.mock.calls[0][0];
      expect(formData.get('name')).toBe('Test Org');
      expect(formData.get('domain')).toBe('test.com');
    });
  });

  it('should display error message on failed registration', async () => {
    const mockRegisterAction = actions.registerAction as jest.Mock;
    mockRegisterAction.mockResolvedValue({ error: 'Registration failed' });

    renderWithProviders(<RegisterPage />);
    
    fireEvent.change(screen.getByLabelText(/organization name/i), {
      target: { value: 'Test Org' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create organization/i }));

    await waitFor(() => {
      expect(mockRegisterAction).toHaveBeenCalled();
    });
  });
}); 
