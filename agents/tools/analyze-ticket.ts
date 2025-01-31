import { DynamicTool } from '@langchain/core/tools';

export const analyzeTicketTool = new DynamicTool({
  name: "analyze_ticket",
  description: "Analyzes a support ticket and determines if it requires human intervention",
  func: async (ticket: string) => {
    const requiresHuman = ticket.toLowerCase().includes('escalate') || 
                         ticket.toLowerCase().includes('human assistance');
    return JSON.stringify({
      requires_human: requiresHuman,
      status: requiresHuman ? 'in-progress' : 'open'
    });
  },
}); 