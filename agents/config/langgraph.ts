import { z } from 'zod';

// Define the agent state schema
export const AgentStateSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  current_ticket: z.object({
    id: z.string().uuid(),
    subject: z.string(),
    description: z.string(),
    status: z.string(),
    priority: z.string(),
  }).optional(),
  similar_tickets: z.array(z.object({
    ticket_id: z.string().uuid(),
    similarity: z.number(),
  })).optional(),
  error: z.string().optional(),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

// LangGraph Cloud configuration
export const config = {
  name: 'cram-support-agent',
  description: 'Customer support agent for Cram ticketing system',
  version: '0.1.0',
  environment: {
    required: [
      'OPENAI_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
  },
  // Default configuration for the agent
  defaults: {
    model: 'gpt-4-1106-preview',
    temperature: 0.7,
    maxTokens: 2000,
  }
} as const;

// Define environment variables schema for LangGraph Cloud
export const LangGraphConfigSchema = z.object({
  LANGGRAPH_API_KEY: z.string().min(1),
  LANGGRAPH_PROJECT: z.string().min(1),
  LANGGRAPH_ENDPOINT: z.string().url().optional().default('https://api.langgraph.cloud'),
  LANGGRAPH_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
});

// Export type for the config
export type LangGraphConfig = z.infer<typeof LangGraphConfigSchema>;

// Parse and validate environment variables
export function validateLangGraphConfig(): LangGraphConfig {
  try {
    return LangGraphConfigSchema.parse({
      LANGGRAPH_API_KEY: process.env.LANGGRAPH_API_KEY,
      LANGGRAPH_PROJECT: process.env.LANGGRAPH_PROJECT,
      LANGGRAPH_ENDPOINT: process.env.LANGGRAPH_ENDPOINT,
      LANGGRAPH_ENVIRONMENT: process.env.LANGGRAPH_ENVIRONMENT || 'development',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`LangGraph config validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

// Export validated config
export const langgraphConfig = validateLangGraphConfig(); 