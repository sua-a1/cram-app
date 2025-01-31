// Stub implementations for agent-related functionality
// These are used in the Vercel deployment to prevent build errors

export const helloWorldAgent = {
  invoke: async () => {
    return {
      status: 'success',
      message: 'Agent functionality is not available in this deployment'
    };
  }
};

export const ticketProcessor = {
  invoke: async () => {
    return {
      status: 'error',
      message: 'Ticket processing is not available in this deployment'
    };
  }
};

export const langsmith = {
  createRun: async () => {
    console.warn('LangSmith functionality is not available in this deployment');
    return null;
  }
};

export const envConfig = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY || '',
  LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT || '',
  NODE_ENV: process.env.NODE_ENV || 'production'
}; 