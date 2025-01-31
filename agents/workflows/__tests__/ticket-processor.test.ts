import { describe, it, expect } from 'vitest';
import { closeTicketTool } from '../ticket-processor';

describe('closeTicket', () => {
  it('should create a command to close ticket with reason', async () => {
    const testTicketId = '123e4567-e89b-12d3-a456-426614174000';
    const testReason = 'Issue resolved and user confirmed closure';

    const result = await closeTicketTool.invoke({
      ticketId: testTicketId,
      reason: testReason,
    });

    expect(result).toMatchObject({
      update: {
        status: 'closed',
        messages: [{
          type: 'system',
          content: `Ticket closed. Reason: ${testReason}`,
          metadata: { ticketId: testTicketId }
        }]
      }
    });
  });

  it('should throw error with invalid ticket ID', async () => {
    await expect(closeTicketTool.invoke({
      ticketId: 'invalid-uuid',
      reason: 'test reason'
    })).rejects.toThrow();
  });
}); 