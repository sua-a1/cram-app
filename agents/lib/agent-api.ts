import { z } from 'zod';

// Validation schemas
const AgentConfigSchema = z.object({
  apiKey: z.string().min(1),
  projectId: z.string().min(1),
  endpoint: z.string().url().optional().default('https://api.langgraph.cloud'),
  environment: z.enum(['development', 'production']).optional().default('development'),
});

const TicketResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
});

// Types
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
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
  }

  async processTicket(ticketId: string): Promise<TicketResponse> {
    try {
      const response = await fetch(`${this.config.endpoint}/v1/tickets/${ticketId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Project-ID': this.config.projectId,
          'X-Environment': this.config.environment,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new AgentError(
          error.message || 'Failed to process ticket',
          'PROCESSING_ERROR',
          response.status
        );
      }

      const data = await response.json();
      const result = TicketResponseSchema.safeParse(data);

      if (!result.success) {
        throw new AgentError(
          'Invalid response from agent',
          'INVALID_RESPONSE',
          500
        );
      }

      return result.data;
    } catch (error) {
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
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Project-ID': this.config.projectId,
          'X-Environment': this.config.environment,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
} 