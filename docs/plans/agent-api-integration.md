# Agent API Integration Plan

## Overview
This document outlines the plan for integrating the LangGraph-deployed agent with the main Cram web application.

## 1. Architecture

### LangGraph Platform API
- Each deployed agent gets a unique endpoint: `https://api.langgraph.com/v1/agents/cram-support-agent/invoke`
- Authentication via `LANGGRAPH_API_KEY`
- Built-in monitoring and logging

### Integration Layer
```typescript
// src/lib/agent-api.ts
interface AgentConfig {
  apiKey: string;
  projectId: string;
  endpoint?: string;
}

export class AgentAPI {
  private config: AgentConfig;
  private baseUrl: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this.baseUrl = config.endpoint || 'https://api.langgraph.com/v1';
  }

  async processTicket(ticketId: string, metadata?: Record<string, any>) {
    const response = await fetch(`${this.baseUrl}/agents/cram-support-agent/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        ticketId,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Agent API error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### Web App Integration
```typescript
// src/app/api/tickets/[id]/process/route.ts
import { AgentAPI } from '@/lib/agent-api';

const agentApi = new AgentAPI({
  apiKey: process.env.LANGGRAPH_API_KEY!,
  projectId: process.env.LANGGRAPH_PROJECT!
});

export async function POST(request: Request) {
  const { ticketId } = await request.json();
  
  try {
    const result = await agentApi.processTicket(ticketId);
    return Response.json(result);
  } catch (error) {
    console.error('Error processing ticket:', error);
    return Response.json({ error: 'Failed to process ticket' }, { status: 500 });
  }
}
```

## 2. Implementation Tasks

### Phase 1: Basic Integration
- [ ] Create `AgentAPI` class
- [ ] Add basic error handling
- [ ] Implement ticket processing endpoint
- [ ] Add environment variable validation

### Phase 2: Enhanced Features
- [ ] Add retry logic for failed requests
- [ ] Implement request timeout handling
- [ ] Add rate limiting
- [ ] Enhance error handling with specific error types

### Phase 3: Monitoring & Logging
- [ ] Add request/response logging
- [ ] Implement performance monitoring
- [ ] Add error tracking
- [ ] Set up alerts for failures

### Phase 4: Additional Features
- [ ] Add agent status checking
- [ ] Implement agent configuration management
- [ ] Add batch processing capabilities
- [ ] Create admin interface for agent management

## 3. Security Considerations
- Secure storage of `LANGGRAPH_API_KEY`
- Rate limiting to prevent abuse
- Request validation
- Error message sanitization
- Access control for agent operations

## 4. Error Handling Strategy
1. Network Errors
   - Implement exponential backoff
   - Set maximum retry attempts
   - Log failed attempts

2. API Errors
   - Handle specific error codes
   - Provide meaningful error messages
   - Log errors with context

3. Validation Errors
   - Validate requests before sending
   - Handle invalid responses
   - Log validation failures

## 5. Monitoring Plan
1. Performance Metrics
   - Response times
   - Success/failure rates
   - Rate limit usage

2. Error Tracking
   - Error rates by type
   - Failed retries
   - Timeout occurrences

3. Usage Analytics
   - Requests per ticket
   - Agent utilization
   - Response quality metrics

## Next Steps
1. Implement basic `AgentAPI` class
2. Set up error handling
3. Add monitoring
4. Deploy and test
5. Iterate based on usage patterns 