const { run: helloWorldRun } = require('./agents/workflows/hello-world');
const { run: ticketProcessorRun } = require('./agents/workflows/ticket-processor');

// Define the LangGraph Cloud configuration type
interface LangGraphEndpoint {
  path: string;
  function: Function;
  description: string;
  config?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  metadata?: {
    requires?: {
      OPENAI_API_KEY?: boolean;
      LANGSMITH_API_KEY?: boolean;
      LANGSMITH_PROJECT?: boolean;
    };
  };
}

interface LangGraphConfig {
  project: string;
  endpoints: LangGraphEndpoint[];
  environment: 'development' | 'staging' | 'production';
  version?: string;
  metadata?: {
    description?: string;
    repository?: string;
  };
  dependencies?: string[];
}

// Define the LangGraph Cloud configuration
const langGraphConfig: LangGraphConfig = {
  project: process.env.LANGGRAPH_PROJECT || 'cram-app',
  version: '1.0.0',
  metadata: {
    description: 'Cram App LangGraph API',
    repository: 'https://github.com/sua-a1/cram-app'
  },
  dependencies: [
    'langchain>=0.1.0',
    'openai>=1.0.0',
    'langsmith>=0.0.69',
    'langgraph>=0.0.20'
  ],
  endpoints: [
    {
      path: '/hello',
      function: helloWorldRun,
      description: 'Simple hello world agent for testing',
      config: {
        model: process.env.OPENAI_MODEL || 'gpt-4-1106-preview',
        temperature: 0.7,
        maxTokens: 1000
      },
      metadata: {
        requires: {
          OPENAI_API_KEY: true,
          LANGSMITH_API_KEY: true,
          LANGSMITH_PROJECT: true
        }
      }
    },
    {
      path: '/process-ticket',
      function: ticketProcessorRun,
      description: 'Process and respond to customer support tickets',
      config: {
        model: process.env.OPENAI_MODEL || 'gpt-4-1106-preview',
        temperature: 0.3,
        maxTokens: 2000
      },
      metadata: {
        requires: {
          OPENAI_API_KEY: true,
          LANGSMITH_API_KEY: true,
          LANGSMITH_PROJECT: true
        }
      }
    },
  ],
  environment: (process.env.LANGGRAPH_ENVIRONMENT as LangGraphConfig['environment']) || 'development',
};

// Export the endpoints for local development
const endpoints = {
  helloWorld: helloWorldRun,
  processTicket: ticketProcessorRun,
};

module.exports = {
  config: langGraphConfig,
  endpoints,
}; 