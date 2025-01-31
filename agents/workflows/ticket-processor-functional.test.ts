import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ticketProcessorAgent } from './ticket-processor-functional';
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

// Mock the storeTicketMessage utility
vi.mock('../utils/ticket-messages', () => ({
  storeTicketMessage: vi.fn().mockResolvedValue(undefined)
}));

describe('Ticket Processor Functional Workflow', () => {
  const mockTicketId = uuidv4();
  const mockUserId = uuidv4();

  const checkMessageContent = (msg: BaseMessage, searchText: string): boolean => {
    const content = msg.content;
    const metadata = msg.additional_kwargs?.metadata as { status?: string };
    
    if (typeof content === 'string') {
      return content.includes(searchText);
    }
    
    return false;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const invokeAgent = async (input: any) => {
    const config = {
      configurable: {
        thread_id: uuidv4(),
        run_name: `test_run_${Date.now()}`
      }
    };

    return ticketProcessorAgent.invoke(input, config);
  };

  it('should process a size and fit inquiry', async () => {
    const result = await invokeAgent({
      ticket: "I usually wear US size 8 in dresses. Would that be a Medium in your sizing?",
      ticketId: mockTicketId,
      userId: mockUserId
    });

    expect(result.final_answer).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.requires_human).toBeDefined();
    expect(result.messages).toBeInstanceOf(Array);
  }, 15000);

  it('should handle a return request for unworn item', async () => {
    const result = await invokeAgent({
      ticket: "I received my order #12345 yesterday but the dress doesn't fit. It's unworn with tags still attached. Can I return it?",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: 'The dress was $129.99',
        }
      ]
    });

    expect(result.final_answer).toBeDefined();
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'return') || 
      (msg.additional_kwargs?.metadata as { status?: string })?.status === 'in-progress'
    )).toBe(true);
  }, 15000);

  it('should handle existing return status inquiry', async () => {
    const result = await invokeAgent({
      ticket: "When will I receive my refund? I returned my order last week.",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: 'I returned order #12345',
        },
        {
          type: 'ai',
          content: 'I can help you track your return. Could you confirm when you shipped it?',
        },
        {
          type: 'human',
          content: 'I shipped it on Monday using the return label provided',
        }
      ]
    });

    expect(result.messages.length).toBeGreaterThan(3);
    expect(result.final_answer).toBeDefined();
  }, 15000);

  it('should escalate damaged item issues to human agent', async () => {
    const result = await invokeAgent({
      ticket: "I just received my order #12345 and the silk blouse has a tear in the seam. I paid $200 for this and I'm very disappointed. I need this resolved immediately as I was planning to wear it to an event this weekend.",
      ticketId: mockTicketId,
      userId: mockUserId
    });

    expect(result.requires_human).toBe(true);
    expect(result.final_answer).toBeDefined();
  }, 15000);

  it('should close resolved alteration inquiry', async () => {
    const result = await invokeAgent({
      ticket: "Perfect, thanks for explaining the alteration service! You can close this ticket.",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: 'How much does it cost to hem a dress?',
        },
        {
          type: 'ai',
          content: 'We offer complimentary basic hemming services for full-price dresses purchased from us. You can visit any of our stores with your receipt for a fitting. The alteration typically takes 5-7 days to complete.',
        }
      ]
    });

    expect(result.status).toBe('closed');
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'closed') || 
      (msg.additional_kwargs?.metadata as { status?: string })?.status === 'closed'
    )).toBe(true);
  }, 15000);
}); 
