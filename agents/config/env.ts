import { z } from 'zod';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Define environment variables schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // OpenAI configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-4-1106-preview'),
  OPENAI_TEMPERATURE: z.number().min(0).max(2).default(0.7),
  
  // LangSmith configuration - optional for local testing
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().optional(),
  LANGSMITH_ENDPOINT: z.string().url().optional(),
  LANGSMITH_TRACING: z.boolean().default(false),
  
  // LangGraph Cloud configuration - optional for local testing
  LANGGRAPH_API_KEY: z.string().min(1).optional(),
  LANGGRAPH_PROJECT: z.string().min(1).optional(),
  LANGGRAPH_ENDPOINT: z.string().url().optional().default('https://api.langgraph.cloud'),
  LANGGRAPH_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
});

// Parse and export environment variables
export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
  LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT,
  LANGSMITH_ENDPOINT: process.env.LANGSMITH_ENDPOINT,
  LANGSMITH_TRACING: process.env.LANGSMITH_TRACING === 'true',
  LANGGRAPH_API_KEY: process.env.LANGGRAPH_API_KEY,
  LANGGRAPH_PROJECT: process.env.LANGGRAPH_PROJECT,
  LANGGRAPH_ENDPOINT: process.env.LANGGRAPH_ENDPOINT,
  LANGGRAPH_ENVIRONMENT: process.env.LANGGRAPH_ENVIRONMENT || 'development',
}); 
