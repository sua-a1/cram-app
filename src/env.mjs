import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    LANGGRAPH_API_KEY: z.string().min(1),
    LANGGRAPH_PROJECT: z.string().min(1),
    LANGGRAPH_ENDPOINT: z.string().url().optional().default('https://cram-agents-75dcc278627754ae969c56bff2d79eed.us.langgraph.app'),
    LANGGRAPH_ENVIRONMENT: z.enum(['development', 'production']).optional().default('development'),
    LANGSMITH_API_KEY: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    LANGGRAPH_API_KEY: process.env.LANGGRAPH_API_KEY,
    LANGGRAPH_PROJECT: process.env.LANGGRAPH_PROJECT,
    LANGGRAPH_ENDPOINT: process.env.LANGGRAPH_ENDPOINT,
    LANGGRAPH_ENVIRONMENT: process.env.LANGGRAPH_ENVIRONMENT,
    LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
  },
}); 
