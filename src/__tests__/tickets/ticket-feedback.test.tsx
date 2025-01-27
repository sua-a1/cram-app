import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketFeedbackPrompt } from '@/components/tickets/ticket-feedback-prompt';
import { TicketFeedbackDialog } from '@/components/tickets/ticket-feedback-dialog';
import { submitFeedback } from '@/app/actions/tickets';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Mock use-toast module
jest.mock('@/hooks/use-toast', () => {
  const mockToast = jest.fn();
  return {
    toast: mockToast,
    useToast: () => ({ toast: mockToast }),
    mockToast, // Export for test assertions
  };
});

// Import mockToast after mocking
const { mockToast } = require('@/hooks/use-toast');

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: () => <div data-testid="star-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key';

// Create mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => mockSupabase),
}));

// Mock server actions with implementation that matches our server-side behavior
jest.mock('@/app/actions/tickets', () => ({
  submitFeedback: jest.fn(async ({ ticketId, userId, rating, feedback }) => {
    if (rating === 0) {
      return { success: false, error: 'Rating required' };
    }
    return { success: true };
  }),
}));

describe('Ticket Feedback Components', () => {
  const mockTicketId = '123';
  const mockUserId = '456';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
    mockToast.mockClear();
  });

  describe('TicketFeedbackPrompt', () => {
    it('renders prompt when no feedback exists', () => {
      render(
        <TicketFeedbackPrompt
          ticketId={mockTicketId}
          userId={mockUserId}
          hasFeedback={false}
        />
      );

      expect(screen.getByText(/help us improve/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /provide feedback/i })).toBeInTheDocument();
    });

    it('does not render when feedback exists', () => {
      render(
        <TicketFeedbackPrompt
          ticketId={mockTicketId}
          userId={mockUserId}
          hasFeedback={true}
        />
      );

      expect(screen.queryByText(/help us improve/i)).not.toBeInTheDocument();
    });

    it('opens feedback dialog when button is clicked', async () => {
      render(
        <TicketFeedbackPrompt
          ticketId={mockTicketId}
          userId={mockUserId}
          hasFeedback={false}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /provide feedback/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('TicketFeedbackDialog', () => {
    const mockOnOpenChange = jest.fn();

    beforeEach(() => {
      mockOnOpenChange.mockClear();
    });

    it('renders dialog with all elements when open', () => {
      render(
        <TicketFeedbackDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          ticketId={mockTicketId}
          userId={mockUserId}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Ticket Feedback')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(8); // 5 stars + submit + cancel + close
      expect(screen.getByPlaceholderText(/additional comments/i)).toBeInTheDocument();
    });

    it('submits feedback successfully', async () => {
      (submitFeedback as jest.Mock).mockResolvedValueOnce({ success: true });

      render(
        <TicketFeedbackDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          ticketId={mockTicketId}
          userId={mockUserId}
        />
      );

      // Click star rating
      const stars = screen.getAllByRole('button').slice(0, 5);
      await userEvent.click(stars[3]); // 4-star rating

      // Enter feedback
      await userEvent.type(screen.getByPlaceholderText(/additional comments/i), 'Great service!');

      // Submit feedback
      await userEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

      await waitFor(() => {
        expect(submitFeedback).toHaveBeenCalledWith({
          ticketId: mockTicketId,
          userId: mockUserId,
          rating: 4,
          feedback: 'Great service!',
        });
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('requires rating before submission', async () => {
      render(
        <TicketFeedbackDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          ticketId={mockTicketId}
          userId={mockUserId}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Rating required',
          description: 'Please select a rating before submitting.',
          variant: 'destructive',
        }));
      });
      expect(submitFeedback).not.toHaveBeenCalled();
    });

    it('handles submission errors', async () => {
      (submitFeedback as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Failed to submit feedback',
      });

      render(
        <TicketFeedbackDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          ticketId={mockTicketId}
          userId={mockUserId}
        />
      );

      // Click star rating and submit
      const stars = screen.getAllByRole('button').slice(0, 5);
      await userEvent.click(stars[3]);
      await userEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Error',
          description: 'Failed to submit feedback',
          variant: 'destructive',
        }));
      });
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });
}); 
