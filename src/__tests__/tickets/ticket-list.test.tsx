import { render, screen } from '@testing-library/react';
import { TicketList } from '@/components/tickets/ticket-list';
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

const mockHandlers = {
  onCreateTicket: jest.fn().mockResolvedValue(undefined),
  onEditTicket: jest.fn().mockResolvedValue(undefined),
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
}

describe('Organization Ticket List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display "No tickets found" when empty', () => {
    renderWithProviders(
      <TicketList 
        tickets={[]} 
        onCreateTicket={mockHandlers.onCreateTicket}
        onEditTicket={mockHandlers.onEditTicket}
      />
    );
    expect(screen.getByText(/no tickets/i)).toBeInTheDocument();
  });

  it('should render ticket list with data', () => {
    renderWithProviders(
      <TicketList 
        tickets={mockTickets}
        onCreateTicket={mockHandlers.onCreateTicket}
        onEditTicket={mockHandlers.onEditTicket}
      />
    );
    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/open/i)).toBeInTheDocument();
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(
      <TicketList 
        tickets={[]}
        isLoading={true}
        onCreateTicket={mockHandlers.onCreateTicket}
        onEditTicket={mockHandlers.onEditTicket}
      />
    );
    // Check for loading skeleton elements by their class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(6);
  });

  it('should render ticket management actions', () => {
    renderWithProviders(
      <TicketList 
        tickets={mockTickets}
        onCreateTicket={mockHandlers.onCreateTicket}
        onEditTicket={mockHandlers.onEditTicket}
      />
    );
    expect(screen.getByRole('button', { name: /new ticket/i })).toBeInTheDocument();
    expect(screen.getByText(/all status/i)).toBeInTheDocument();
    expect(screen.getByText(/all priority/i)).toBeInTheDocument();
  });
}); 
