import type { z as zod, ZodError, ZodIssue } from 'zod';
const { z } = require('zod');

// Define environment variables schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // OpenAI configuration
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4-1106-preview'),
  OPENAI_TEMPERATURE: z.number().min(0).max(2).default(0.7),
  
  // LangSmith configuration - optional for local testing
  LANGSMITH_API_KEY: z.string().min(1).optional(),
  LANGSMITH_PROJECT: z.string().min(1).optional(),
  LANGSMITH_ENDPOINT: z.string().url().optional().default('https://api.smith.langchain.com'),
  LANGSMITH_TRACING: z.boolean().default(true),
  
  // LangGraph Cloud configuration - optional for local testing
  LANGGRAPH_API_KEY: z.string().min(1).optional(),
  LANGGRAPH_PROJECT: z.string().min(1).optional(),
  LANGGRAPH_ENDPOINT: z.string().url().optional().default('https://api.langgraph.cloud'),
  LANGGRAPH_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
});

// Define type for the environment
type Env = zod.infer<typeof envSchema>;

// Parse and validate environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : undefined,
      LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
      LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT,
      LANGSMITH_ENDPOINT: process.env.LANGSMITH_ENDPOINT,
      LANGSMITH_TRACING: process.env.LANGSMITH_TRACING === 'true',
      LANGGRAPH_API_KEY: process.env.LANGGRAPH_API_KEY,
      LANGGRAPH_PROJECT: process.env.LANGGRAPH_PROJECT,
      LANGGRAPH_ENDPOINT: process.env.LANGGRAPH_ENDPOINT,
      LANGGRAPH_ENVIRONMENT: process.env.LANGGRAPH_ENVIRONMENT || 'development',
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'errors' in error) {
      const zodError = error as ZodError;
      const missingVars = zodError.errors.map((err: ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

// Export validated environment and types
export const env = validateEnv();
export { validateEnv }; 
