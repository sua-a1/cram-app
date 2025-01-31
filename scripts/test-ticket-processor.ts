import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { analyzeTicketTool } from '../agents/tools/analyze-ticket';
import { documentRetrievalTool } from '../agents/tools/document-retrieval-tool';
import { v4 as uuidv4 } from 'uuid';

const testCases = [
  {
    name: "Return Policy Question",
    ticket: "Hi, I bought a dress last week but it doesn't fit. How can I return it?"
  },
  {
    name: "Complex Order Issue",
    ticket: "I need human assistance. My order #12345 was delivered to the wrong address and I've been charged twice."
  },
  {
    name: "Simple Shipping Question",
    ticket: "What are the shipping options for delivery to Canada?"
  }
];

async function simulateTicketProcessor(ticket: string) {
  console.log('\n=== Testing Ticket ===');
  console.log('Input:', ticket);
  
  try {
    // 1. Test ticket analysis
    console.log('\n1. Analyzing ticket...');
    const analysisResult = await analyzeTicketTool.invoke(ticket);
    const analysis = JSON.parse(analysisResult);
    console.log('Analysis Result:', analysis);

    // 2. Test document retrieval
    console.log('\n2. Retrieving relevant documents...');
    const documents = await documentRetrievalTool.invoke(ticket);
    console.log('Retrieved Documents:', documents);

    // 3. Test response generation
    console.log('\n3. Generating response...');
    const model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7
    });

    const prompt = `You are a customer service AI assistant for MyWork, an online fashion retailer.
    Use the following context to help resolve the customer inquiry:
    ${documents}
    
    Customer inquiry: ${ticket}
    
    Please provide a helpful response. If you need more information or if this requires human intervention, please say so.`;

    const response = await model.invoke([new HumanMessage(prompt)]);
    console.log('AI Response:', response.content);

    return {
      ticket_id: uuidv4(),
      requires_human: analysis.requires_human,
      status: analysis.status,
      response: response.content,
      context: documents
    };

  } catch (error) {
    console.error('Error processing ticket:', error);
    throw error;
  }
}

async function runTests() {
  console.log('Starting Ticket Processor Tests\n');
  
  for (const testCase of testCases) {
    console.log(`\n=== Test Case: ${testCase.name} ===`);
    try {
      const result = await simulateTicketProcessor(testCase.ticket);
      console.log('\nTest Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`Error in test case ${testCase.name}:`, error);
    }
  }
}

// Run the tests
runTests().catch(console.error); 