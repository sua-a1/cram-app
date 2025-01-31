import { z } from 'zod';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = resolve(__dirname, '../../.env');
console.log('Loading .env file from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw result.error;
}

// Debug: Log all environment variables (without sensitive values)
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '[PRESENT]' : '[MISSING]',
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE,
  LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY ? '[PRESENT]' : '[MISSING]',
  LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT,
  LANGSMITH_ENDPOINT: process.env.LANGSMITH_ENDPOINT,
  LANGSMITH_TRACING: process.env.LANGSMITH_TRACING,
  LANGGRAPH_API_KEY: process.env.LANGGRAPH_API_KEY ? '[PRESENT]' : '[MISSING]',
  LANGGRAPH_PROJECT: process.env.LANGGRAPH_PROJECT,
  LANGGRAPH_ENDPOINT: process.env.LANGGRAPH_ENDPOINT,
  LANGGRAPH_ENVIRONMENT: process.env.LANGGRAPH_ENVIRONMENT,
});

// Define environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-4-1106-preview'),
  OPENAI_TEMPERATURE: z.number().min(0).max(2).default(0.7),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().optional(),
  LANGSMITH_ENDPOINT: z.string().url().optional(),
  LANGSMITH_TRACING: z.boolean().default(false),
  LANGGRAPH_API_KEY: z.string().optional(),
  LANGGRAPH_PROJECT: z.string().optional(),
  LANGGRAPH_ENDPOINT: z.string().url().optional().default('https://api.langgraph.cloud'),
  LANGGRAPH_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
});

// Function to validate environment variables with better error messages
function validateEnv() {
  try {
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
      LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT,
      LANGSMITH_ENDPOINT: process.env.LANGSMITH_ENDPOINT,
      LANGSMITH_TRACING: process.env.LANGSMITH_TRACING === 'true',
      LANGGRAPH_API_KEY: process.env.LANGGRAPH_API_KEY || undefined,
      LANGGRAPH_PROJECT: process.env.LANGGRAPH_PROJECT || undefined,
      LANGGRAPH_ENDPOINT: process.env.LANGGRAPH_ENDPOINT,
      LANGGRAPH_ENVIRONMENT: process.env.LANGGRAPH_ENVIRONMENT || 'development',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv(); 
