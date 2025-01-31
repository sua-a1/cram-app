import { z } from 'zod';
import crossFetch from 'cross-fetch';

// Validation schemas
const AgentConfigSchema = z.object({
  apiKey: z.string().min(1),
  projectId: z.string().min(1),
  endpoint: z.string().url().optional().default('https://cram-agents-75dcc278627754ae969c56bff2d79eed.us.langgraph.app'),
  environment: z.enum(['development', 'production']).optional().default('development'),
});

const AgentEventSchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()),
});

const TicketResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
});

// Types
export type TicketInput = {
  ticketId: string;
  userId: string;
  ticket: string;
  previousMessages: any[];
};

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AgentEvent = z.infer<typeof AgentEventSchema>;
export type TicketResponse = z.infer<typeof TicketResponseSchema>;

// Custom error class
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class AgentAPI {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    // Validate config
    const result = AgentConfigSchema.safeParse(config);
    if (!result.success) {
      throw new AgentError(
        'Invalid agent configuration',
        'INVALID_CONFIG',
        400
      );
    }
    this.config = result.data;
    console.log('AgentAPI initialized with config:', {
      endpoint: this.config.endpoint,
      projectId: this.config.projectId,
      environment: this.config.environment,
    });
  }

  async processTicket(input: TicketInput): Promise<TicketResponse> {
    try {
      // Ensure the endpoint doesn't end with a slash
      const baseEndpoint = this.config.endpoint.replace(/\/$/, '');
      
      // Following LangGraph Cloud API structure
      const url = `${baseEndpoint}/runs`;
      const headers = {
        'Content-Type': 'application/json',
        'X-Api-Key': this.config.apiKey,
      };

      // Format messages for the workflow
      const formattedMessages = input.previousMessages.map(msg => ({
        type: msg.author_id === '00000000-0000-0000-0000-000000000000' ? 'ai' : 'human',
        content: msg.body,
        metadata: msg.metadata || {}
      }));

      const body = {
        assistant_id: 'ticket-processor',
        input: {
          ticket: input.ticket,
          ticketId: input.ticketId,
          userId: input.userId,
          previousMessages: formattedMessages,
          messages: [
            {
              type: 'system',
              content: "You are a helpful customer support agent. Process the ticket and provide a clear, professional response."
            },
            ...formattedMessages,
            {
              type: 'human',
              content: input.ticket
            }
          ]
        },
        metadata: {
          environment: this.config.environment,
          project_id: this.config.projectId
        },
        config: {
          tags: ['ticket', 'processing'],
          recursion_limit: 10,
          configurable: {}
        },
        stream_mode: ['values'],
        feedback_keys: ['status', 'message'],
        stream_subgraphs: false,
        on_completion: 'delete',
        on_disconnect: 'cancel'
      };

      console.log('Making request to:', url);
      console.log('With headers:', {
        'Content-Type': headers['Content-Type'],
        'X-Api-Key': '[REDACTED]'
      });
      console.log('Request body:', body);

      const response = await crossFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e);
        }
        throw new AgentError(
          errorJson?.message || errorText || 'Failed to process ticket',
          'PROCESSING_ERROR',
          response.status
        );
      }

      // Get the response text instead of using streaming
      const responseText = await response.text();
      console.log('Complete response:', responseText);

      // Parse the response
      const events = responseText.split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            console.warn('Failed to parse event:', line);
            return null;
          }
        })
        .filter(event => event);

      const lastEvent = events[events.length - 1];
      console.log('Last event:', lastEvent);

      return {
        status: 'success',
        message: 'Ticket processed',
        data: lastEvent
      };
    } catch (error) {
      console.error('Error details:', error);
      
      if (error instanceof AgentError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AgentError(
          error.message,
          'NETWORK_ERROR',
          500
        );
      }
      throw new AgentError(
        'Unknown error occurred',
        'UNKNOWN_ERROR',
        500
      );
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const url = `${this.config.endpoint}/health`;
      console.log('Checking health at:', url);
      
      const response = await crossFetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.config.apiKey,
        },
      });

      console.log('Health check status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
} 
