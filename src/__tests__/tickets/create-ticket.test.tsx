import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerTicketList } from '@/components/tickets/customer-ticket-list';
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import { ToastProvider } from '../mocks/toast-provider';
import type { TicketWithDetails } from '@/types/tickets';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
}));

// Mock toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock form submission
const mockCreateTicket = jest.fn();
jest.mock('@/app/actions/tickets', () => ({
  createTicket: (...args: any[]) => mockCreateTicket(...args),
}));

const mockTickets: TicketWithDetails[] = [{
  id: '123',
  subject: 'Test Ticket',
  description: 'Test Description',
  status: 'open',
  priority: 'medium',
  user_id: 'user123',
  handling_org_id: 'org123',
  handling_org: { name: 'Test Org', id: 'org123' },
  assigned_team: null,
  assigned_employee: null,
  created_at: '2024-01-24T12:00:00Z',
  updated_at: '2024-01-24T12:00:00Z'
}];

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
}

describe('Ticket Creation Flow', () => {
  beforeEach(() => {
    mockToast.mockClear();
    mockCreateTicket.mockReset();
  });

  it('should render create ticket button', () => {
    renderWithProviders(<CustomerTicketList tickets={mockTickets} />);
    expect(screen.getByRole('button', { name: /create ticket/i })).toBeInTheDocument();
  });

  it('should handle successful ticket creation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateTicketDialog />);
    
    // Open dialog
    await user.click(screen.getByRole('button', { name: /create ticket/i }));

    // Fill form
    await user.type(screen.getByLabelText(/subject/i), 'Test Ticket');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Check if toast was called with success message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Ticket created successfully',
      });
    });
  });

  it('should display error message on failed ticket creation', async () => {
    // Mock the rejection before rendering
    mockCreateTicket.mockRejectedValue(new Error('Failed to create ticket'));
    
    const user = userEvent.setup();
    renderWithProviders(<CreateTicketDialog />);
    
    // Open dialog
    await user.click(screen.getByRole('button', { name: /create ticket/i }));

    // Fill form with valid data
    await user.type(screen.getByLabelText(/subject/i), 'Test Ticket');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Wait for and check toast error message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create ticket',
        variant: 'destructive',
      });
    });
  });
}); 
