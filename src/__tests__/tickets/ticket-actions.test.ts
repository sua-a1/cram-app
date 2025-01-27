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

// Use doMock instead of mock to prevent hoisting
jest.doMock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Import after mocking
const { closeTicket, submitFeedback } = jest.requireActual('@/app/actions/tickets');

describe('Ticket Actions', () => {
  const mockTicketId = '123';
  const mockUserId = '456';
  const mockRating = 5;
  const mockFeedback = 'Great service!';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('closeTicket', () => {
    it('successfully closes a ticket', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: 'open', user_id: mockUserId },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockTicketId },
        error: null,
      });

      const result = await closeTicket(mockTicketId, mockUserId);
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'closed',
        updated_at: expect.any(String),
      });
    });

    it('fails if ticket is not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await closeTicket(mockTicketId, mockUserId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Ticket not found');
    });

    it('fails if user does not own the ticket', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: 'open', user_id: 'different-user' },
        error: null,
      });

      const result = await closeTicket(mockTicketId, mockUserId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authorized to close this ticket');
    });

    it('fails if ticket is already closed', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: 'closed', user_id: mockUserId },
        error: null,
      });

      const result = await closeTicket(mockTicketId, mockUserId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Ticket is already closed');
    });
  });

  describe('submitFeedback', () => {
    it('successfully submits feedback', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: 'closed', user_id: mockUserId },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'new-feedback' },
        error: null,
      });

      const result = await submitFeedback({
        ticketId: mockTicketId,
        userId: mockUserId,
        rating: mockRating,
        feedback: mockFeedback,
      });
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('ticket_feedback');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ticket_id: mockTicketId,
        user_id: mockUserId,
        rating: mockRating,
        feedback: mockFeedback,
      });
    });

    it('fails if feedback already exists', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: 'closed', user_id: mockUserId },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing-feedback' },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await submitFeedback({
        ticketId: mockTicketId,
        userId: mockUserId,
        rating: mockRating,
        feedback: mockFeedback,
      });
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('ticket_feedback');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        rating: mockRating,
        feedback: mockFeedback,
        updated_at: expect.any(String),
      });
    });
  });
}); 
