import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test user ID (must match the one in the route handler)
const TEST_USER_ID = 'b1cc819e-46e8-43cb-b7a8-4ec8f42916e8';

async function createTestTicket() {
  try {
    // Create a test organization if it doesn't exist
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        name: 'Test Organization',
        domain: 'test.com',
        status: 'active'
      })
      .select()
      .single();

    if (orgError) {
      throw orgError;
    }

    console.log('Created/updated test organization:', org);

    // Create a test user profile if it doesn't exist
    // Note: For customers, org_id must be NULL per schema constraint
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: TEST_USER_ID,
        email: 'test@example.com',
        display_name: 'Test User',
        role: 'customer',
        approval_status: 'approved',
        organization_name: null,  // Explicitly set to null for customers
        department: null,         // Explicitly set to null for customers
        position: null,          // Explicitly set to null for customers
        org_id: null            // Must be null for customers
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    console.log('Created/updated test profile:', profile);

    // Create a test ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        user_id: profile.user_id,
        subject: 'Test Ticket for AI Processing',
        description: 'This is a test ticket to verify the AI agent processing functionality. Please help me with my login issues.',
        status: 'open',
        priority: 'medium',
        handling_org_id: org.id // The organization that will handle the ticket
      })
      .select()
      .single();

    if (ticketError) {
      throw ticketError;
    }

    console.log('Created test ticket:', ticket);
    return ticket;
  } catch (error) {
    console.error('Error creating test ticket:', error);
    throw error;
  }
}

// Run the script
createTestTicket().catch(console.error); 
