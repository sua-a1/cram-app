import { render, screen } from '@testing-library/react';
import { CustomerTicketList } from '@/components/tickets/customer-ticket-list';
import type { TicketWithDetails } from '@/types/tickets';
import { ToastProvider } from '../mocks/toast-provider';

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

describe('Customer Ticket List', () => {
  it('should display "No tickets found" when empty', () => {
    renderWithProviders(<CustomerTicketList tickets={[]} />);
    expect(screen.getByText(/no tickets found/i)).toBeInTheDocument();
  });

  it('should render ticket list with data', () => {
    renderWithProviders(<CustomerTicketList tickets={mockTickets} />);
    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    expect(screen.getByText('Test Org')).toBeInTheDocument(); // Shows organization name
    expect(screen.getByText('open')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(<CustomerTicketList tickets={[]} isLoading={true} />);
    expect(screen.getByText(/loading tickets/i)).toBeInTheDocument();
  });

  it('should render create ticket button', () => {
    renderWithProviders(<CustomerTicketList tickets={[]} />);
    expect(screen.getByRole('button', { name: /create ticket/i })).toBeInTheDocument();
  });

  it('should render ticket links', () => {
    renderWithProviders(<CustomerTicketList tickets={mockTickets} />);
    const ticketLink = screen.getByRole('link', { name: '123' });
    expect(ticketLink).toBeInTheDocument();
    expect(ticketLink).toHaveAttribute('href', '/tickets/123');
  });
}); 