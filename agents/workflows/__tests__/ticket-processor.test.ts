import { describe, it, expect } from 'vitest';
import { closeTicketTool, processRefundTool } from '../ticket-processor';

describe('closeTicket', () => {
  it('should create a command to close ticket with reason', async () => {
    const testTicketId = '123e4567-e89b-12d3-a456-426614174000';
    const testReason = 'Issue resolved and user confirmed closure';

    const result = await closeTicketTool.invoke({
      ticketId: testTicketId,
      reason: testReason,
    });

    expect(result).toMatchObject({
      tool_calls: [{
        type: 'function',
        function: {
          name: 'close_ticket',
          arguments: expect.stringContaining(testTicketId)
        }
      }],
      update: {
        status: 'closed',
        messages: [{
          type: 'system',
          content: `Ticket closed. Reason: ${testReason}`,
          metadata: { ticketId: testTicketId }
        }]
      }
    });

    // Verify the tool call ID format
    expect(result.tool_calls[0].id).toMatch(/^close_ticket_\d+$/);
  });

  it('should throw error with invalid ticket ID', async () => {
    await expect(closeTicketTool.invoke({
      ticketId: 'invalid-uuid',
      reason: 'test reason'
    })).rejects.toThrow();
  });
});

describe('processRefund', () => {
  it('should process a valid refund request', async () => {
    const testTicketId = '123e4567-e89b-12d3-a456-426614174000';
    const testAmount = 99.99;
    const testReason = 'Product damaged on arrival';
    const testOrderRef = 'ORDER-123-456';

    const result = await processRefundTool.invoke({
      ticketId: testTicketId,
      amount: testAmount,
      reason: testReason,
      orderReference: testOrderRef,
    });

    expect(result).toMatchObject({
      tool_calls: [{
        type: 'function',
        function: {
          name: 'process_refund',
          arguments: expect.stringContaining(testTicketId)
        }
      }],
      update: {
        status: 'in-progress',
        messages: [{
          type: 'system',
          content: expect.stringContaining(`$${testAmount.toFixed(2)}`),
          metadata: {
            ticketId: testTicketId,
            refundAmount: testAmount,
            orderReference: testOrderRef,
            refundTimestamp: expect.any(String)
          }
        }]
      }
    });

    // Verify the tool call ID format
    expect(result.tool_calls[0].id).toMatch(/^process_refund_\d+$/);
  });

  it('should throw error with invalid amount', async () => {
    await expect(processRefundTool.invoke({
      ticketId: '123e4567-e89b-12d3-a456-426614174000',
      amount: -50, // negative amount should fail
      reason: 'test reason',
      orderReference: 'ORDER-123'
    })).rejects.toThrow();
  });

  it('should throw error with invalid ticket ID', async () => {
    await expect(processRefundTool.invoke({
      ticketId: 'invalid-uuid',
      amount: 50,
      reason: 'test reason',
      orderReference: 'ORDER-123'
    })).rejects.toThrow();
  });
}); 