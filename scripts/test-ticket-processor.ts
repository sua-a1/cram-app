import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { analyzeTicketTool } from '../agents/tools/analyze-ticket';
import { documentRetrievalTool } from '../agents/tools/document-retrieval-tool';
import { v4 as uuidv4 } from 'uuid';
import { run } from '../agents/workflows/ticket-processor';
import { createServiceClient } from '../agents/lib/server/supabase';

// Test user ID (should match a user in your database)
const TEST_USER_ID = '5281f8db-7dd3-488d-9fa4-2dc1e098ee36';

// Create a single ticket ID to maintain conversation context
const TEST_TICKET_ID = uuidv4();

// Create test ticket in database
async function createTestTicket() {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('tickets')
    .insert({
      id: TEST_TICKET_ID,
      user_id: TEST_USER_ID,
      subject: 'Return Policy Question',
      description: 'Test ticket for conversation flow',
      status: 'open',
      priority: 'medium',
      handling_org_id: null,  // Will be assigned when an employee picks up the ticket
      assigned_team: null,    // Will be assigned when routed
      assigned_employee: null // Will be assigned when picked up
    });

  if (error) {
    console.error('Error creating test ticket:', error);
    throw error;
  }
}

// Sequential conversation test cases
const testCases = [
  {
    name: "Initial Return Policy Question",
    ticket: "Hi, I bought a dress last week but it doesn't fit. What's your return policy?"
  },
  {
    name: "Follow-up Question About Tags",
    ticket: "Thanks for explaining the return policy. The dress still has its tags, but I lost the original packaging. Is that okay?"
  },
  {
    name: "Specific Return Process Question",
    ticket: "Great, so I can return it. How exactly do I start the return process? Do I need to print a label?"
  },
  {
    name: "Final Clarification",
    ticket: "One last thing - how long will it take to get my refund after you receive the return?"
  }
];

async function simulateTicketProcessor(ticket: string, previousMessages: any[] = []) {
  console.log('\n=== Testing Ticket ===');
  console.log('Input:', ticket);
  
  try {
    // Process the ticket with history
    const result = await run({
      ticket,
      ticketId: TEST_TICKET_ID,
      userId: TEST_USER_ID,
      previousMessages
    });

    console.log('\nAI Response:', result.final_answer);
    console.log('Status:', result.status);
    console.log('Requires Human:', result.requires_human);

    return {
      messages: result.messages,
      response: result.final_answer,
      status: result.status,
      requires_human: result.requires_human
    };

  } catch (error) {
    console.error('Error processing ticket:', error);
    throw error;
  }
}

async function runTests() {
  console.log('Starting Sequential Conversation Test\n');
  
  // Create the test ticket first
  await createTestTicket();
  console.log('Created test ticket:', TEST_TICKET_ID);
  
  let conversationHistory: any[] = [];
  
  for (const testCase of testCases) {
    console.log(`\n=== Test Case: ${testCase.name} ===`);
    try {
      // Process each test case sequentially with accumulated history
      const result = await simulateTicketProcessor(testCase.ticket, conversationHistory);
      
      // Add the new messages to conversation history
      conversationHistory = [...conversationHistory, ...result.messages];
      
      // Add a delay between tests to make output more readable
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error in test case ${testCase.name}:`, error);
    }
  }
}

// Run the tests
runTests().catch(console.error); 