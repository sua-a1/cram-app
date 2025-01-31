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

  it('should handle a pre-order inquiry', async () => {
    const result = await invokeAgent({
      ticket: "When will the Bella Evening Dress in Navy be back in stock? I see it's available for pre-order but need it for an event in March.",
      ticketId: mockTicketId,
      userId: mockUserId
    });

    expect(result.final_answer).toBeDefined();
    expect(result.requires_human).toBe(false);
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'pre-order') || 
      checkMessageContent(msg, 'back in stock')
    )).toBe(true);
  }, 15000);

  it('should process a color variation inquiry with specific measurements', async () => {
    const result = await invokeAgent({
      ticket: "I'm interested in the Sofia Maxi Dress, but I'm not sure about the color. Is the 'dusty rose' more pink or peach? Also, what's the length for size M?",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: "I'm 5'7\" if that helps with the length recommendation.",
        }
      ]
    });

    expect(result.final_answer).toBeDefined();
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'color') || 
      checkMessageContent(msg, 'length') ||
      checkMessageContent(msg, 'measurement')
    )).toBe(true);
  }, 15000);

  it('should handle a complex exchange request', async () => {
    const result = await invokeAgent({
      ticket: "I received order #67890 but need to exchange the black cocktail dress (size S) for a medium. Can I get the exchange started before sending back the original?",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: "The dress was $175, and I still have all the original packaging.",
        }
      ]
    });

    expect(result.final_answer).toBeDefined();
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'exchange') || 
      checkMessageContent(msg, 'return label')
    )).toBe(true);
  }, 15000);

  it('should escalate a quality complaint with photos', async () => {
    const result = await invokeAgent({
      ticket: "The beading on my $350 evening gown is falling off after just one gentle hand wash. I have photos showing the damage. This is unacceptable quality for a designer dress.",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: "Order #34567, purchased last month. I followed the care instructions exactly.",
        }
      ]
    });

    expect(result.requires_human).toBe(true);
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'quality') || 
      checkMessageContent(msg, 'specialist')
    )).toBe(true);
  }, 15000);

  it('should handle a shipping delay inquiry', async () => {
    const result = await invokeAgent({
      ticket: "My order #89012 was supposed to arrive yesterday but tracking hasn't updated in 2 days. I need the dress by Saturday for a wedding!",
      ticketId: mockTicketId,
      userId: mockUserId
    });

    expect(result.final_answer).toBeDefined();
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'tracking') || 
      checkMessageContent(msg, 'shipping')
    )).toBe(true);
  }, 15000);

  it('should process a style recommendation request', async () => {
    const result = await invokeAgent({
      ticket: "I'm attending a beach wedding in June. Can you recommend some appropriate dresses under $200? I usually wear size 10.",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: "I prefer dresses with sleeves and I'm looking for something in blue or coral tones.",
        }
      ]
    });

    expect(result.final_answer).toBeDefined();
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'recommend') || 
      checkMessageContent(msg, 'style')
    )).toBe(true);
  }, 15000);

  it('should handle a multi-item order modification', async () => {
    const result = await invokeAgent({
      ticket: "I just placed order #45678 but need to modify it. Can I change the size of the silk blouse to L and remove the scarf?",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: "The order was placed about 10 minutes ago.",
        }
      ]
    });

    expect(result.final_answer).toBeDefined();
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'modify') || 
      checkMessageContent(msg, 'change')
    )).toBe(true);
  }, 15000);

  it('should process a loyalty program inquiry', async () => {
    const result = await invokeAgent({
      ticket: "I've made several purchases this year but haven't received any loyalty points. How does the rewards program work?",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: "My last purchase was order #23456 for $280.",
        }
      ]
    });

    expect(result.final_answer).toBeDefined();
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'loyalty') || 
      checkMessageContent(msg, 'rewards')
    )).toBe(true);
  }, 15000);

  it('should handle a sale price adjustment request', async () => {
    const result = await invokeAgent({
      ticket: "I bought a dress yesterday for $299, and today it's on sale for $249. Can I get a price adjustment?",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: "Order #78901, and I haven't worn or removed any tags.",
        }
      ]
    });

    expect(result.final_answer).toBeDefined();
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'price') || 
      checkMessageContent(msg, 'adjustment')
    )).toBe(true);
  }, 15000);

  it('should escalate a VIP customer complaint', async () => {
    const result = await invokeAgent({
      ticket: "This is my third order this month with issues. I'm a VIP member and spend thousands here annually. I need to speak with a supervisor about the consistent sizing inconsistencies.",
      ticketId: mockTicketId,
      userId: mockUserId,
      messages: [
        {
          type: 'human',
          content: "My recent orders are #12345, #23456, and #34567, all with fit issues.",
        }
      ]
    });

    expect(result.requires_human).toBe(true);
    expect(result.messages.some(msg => 
      checkMessageContent(msg, 'VIP') || 
      checkMessageContent(msg, 'supervisor')
    )).toBe(true);
  }, 15000);
}); 
