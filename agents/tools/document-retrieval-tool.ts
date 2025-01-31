import { DynamicTool } from '@langchain/core/tools';
import { getDocumentContext } from '../utils/document-retrieval';

export const documentRetrievalTool = new DynamicTool({
  name: 'retrieve_relevant_documents',
  description: 'Retrieves relevant policy documents and guidelines based on a query. Use this to find information about company policies, procedures, and guidelines.',
  func: async (query: string) => {
    try {
      const context = await getDocumentContext(query);
      if (!context) {
        return 'No relevant documents found.';
      }
      return `Found relevant documents:\n\n${context}`;
    } catch (error) {
      console.error('Error in document retrieval tool:', error);
      return 'Error retrieving documents. Please try again.';
    }
  }
}); 