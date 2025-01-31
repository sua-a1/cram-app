import { vi } from 'vitest';

export const mockAnalyzeTicketTool = {
  name: 'analyze_ticket',
  description: 'Analyze a ticket to determine if it requires human intervention',
  func: vi.fn().mockResolvedValue({
    requires_human: false,
    status: 'in-progress'
  })
};

export const mockDocumentRetrievalTool = {
  name: 'retrieve_documents',
  description: 'Retrieve relevant documents based on a query',
  func: vi.fn().mockResolvedValue({
    documents: [],
    relevance_scores: []
  })
}; 