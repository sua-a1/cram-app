import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { initializeServer } from '../server'
import { processNewMessage, setupConversationEmbeddingUpdates, processExistingMessages } from '../utils/conversation-embeddings'
import { supabase } from '../utils/supabase'
import { TicketMessage } from '../types/conversation'
import dotenv from 'dotenv'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// Test data
const testTicketId = uuidv4()
const testOrgId = uuidv4()
let testUserId: string // Will be set after user creation
const testEmail = `test-${Date.now()}@example.com` // Unique email for each test run

const createTestMessage = (overrides: Partial<TicketMessage> = {}): TicketMessage => ({
  id: uuidv4(),
  ticket_id: testTicketId,
  author_id: testUserId,
  body: 'Test message body',
  message_type: 'public',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_email: false,
  metadata: null,
  template_id: null,
  parent_message_id: null,
  source: 'web',
  external_id: null,
  author_role: 'employee',
  author_name: 'Test User',
  author_email: testEmail,
  ...overrides
})

const convertToMessageContext = (msg: TicketMessage) => ({
  ticketId: msg.ticket_id,
  messageId: msg.id,
  authorRole: (msg.author_role || 'employee').toLowerCase(),
  messageType: msg.message_type?.toLowerCase(),
  body: msg.body,
  metadata: msg.metadata ? msg.metadata as Record<string, any> : undefined,
  createdAt: msg.created_at,
  severity: 'medium'
})

describe('Conversation Embeddings', () => {
  let subscription: any

  beforeAll(async () => {
    // Create test organization and ticket
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        name: 'Test Organization',
        status: 'active',
        domain: 'test.com'
      })
    expect(orgError).toBeNull()

    // Create test user with unique email
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test-password-123',
      user_metadata: { name: 'Test User' },
      email_confirm: true
    })
    expect(userError).toBeNull()
    expect(userData?.user).toBeDefined()

    if (!userData?.user) {
      throw new Error('Failed to create test user')
    }

    testUserId = userData.user.id

    // Wait for user to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: testUserId,
        display_name: 'Test User',
        role: 'employee',
        org_id: testOrgId,
        email: testEmail
      })
    expect(profileError).toBeNull()

    const { error: ticketError } = await supabase
      .from('tickets')
      .insert({
        id: testTicketId,
        subject: 'Test Ticket',
        user_id: testUserId,
        handling_org_id: testOrgId,
        status: 'open',
        priority: 'medium'
      })
    expect(ticketError).toBeNull()

    // Initialize server features
    subscription = await initializeServer()
    expect(subscription).toBeDefined()
  }, 30000) // Increased timeout for setup

  afterAll(async () => {
    if (subscription) {
      await subscription.unsubscribe()
    }

    // Clean up test data in reverse order of creation
    await supabase.from('conversation_embeddings').delete().eq('ticket_id', testTicketId)
    await supabase.from('ticket_messages').delete().eq('ticket_id', testTicketId)
    await supabase.from('tickets').delete().eq('id', testTicketId)
    await supabase.from('profiles').delete().eq('user_id', testUserId)
    await supabase.auth.admin.deleteUser(testUserId)
    await supabase.from('organizations').delete().eq('id', testOrgId)

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 2000))
  }, 30000) // Increased timeout for cleanup

  beforeEach(async () => {
    // Clean up any existing test messages and embeddings
    await supabase.from('conversation_embeddings').delete().eq('ticket_id', testTicketId)
    await supabase.from('ticket_messages').delete().eq('ticket_id', testTicketId)
    
    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 1000))
  }, 15000) // Increased timeout for beforeEach

  describe('Single Message Processing', () => {
    it('should process a new message and generate embeddings', async () => {
      const message = createTestMessage()
      
      // Insert test message
      const { error: insertError } = await supabase
        .from('ticket_messages')
        .insert(message)
      
      expect(insertError).toBeNull()

      // Wait for message to be inserted
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Process the message
      const success = await processNewMessage(convertToMessageContext(message))
      expect(success).toBe(true)

      // Wait for embedding to be processed
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify embedding was created
      const { data: embeddings, error: fetchError } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('message_id', message.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(fetchError).toBeNull()
      expect(embeddings).toBeDefined()
      const parsedEmbedding = JSON.parse(embeddings.embedding)
      expect(Array.isArray(parsedEmbedding)).toBe(true)
      expect(parsedEmbedding.length).toBe(1536) // OpenAI embedding dimension
      expect(embeddings.context_window).toContain(message.body)
    }, 30000)

    it('should handle messages with special characters and formatting', async () => {
      const message = createTestMessage({
        body: '**Bold** text with *italics* and some `code` and [link](https://example.com)',
      })

      const { error: insertError } = await supabase
        .from('ticket_messages')
        .insert(message)
      
      expect(insertError).toBeNull()

      const success = await processNewMessage(convertToMessageContext(message))
      expect(success).toBe(true)

      const { data: embedding } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('message_id', message.id)
        .single()

      expect(embedding).toBeDefined()
      const parsedEmbedding = JSON.parse(embedding.embedding)
      expect(embedding.context_window).toContain(message.body)
    }, 10000)
  })

  describe('Conversation Context', () => {
    it('should include previous messages in context window', async () => {
      // Create a sequence of messages
      const messages = [
        createTestMessage({ body: 'First message', created_at: '2024-01-01T00:00:00Z' }),
        createTestMessage({ body: 'Second message', created_at: '2024-01-01T00:01:00Z' }),
        createTestMessage({ body: 'Third message', created_at: '2024-01-01T00:02:00Z' })
      ]

      // Insert messages
      for (const msg of messages) {
        const { error } = await supabase.from('ticket_messages').insert(msg)
        expect(error).toBeNull()
      }

      // Process the last message
      const success = await processNewMessage(convertToMessageContext(messages[2]))
      expect(success).toBe(true)

      // Verify context window includes previous messages
      const { data: embedding } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('message_id', messages[2].id)
        .single()

      expect(embedding.context_window).toContain('First message')
      expect(embedding.context_window).toContain('Second message')
      expect(embedding.context_window).toContain('Third message')
    }, 10000)

    it('should handle customer and employee message types correctly', async () => {
      const messages = [
        createTestMessage({ 
          body: 'Customer inquiry', 
          message_type: 'public',
          author_role: 'customer',
          created_at: '2024-01-01T00:00:00Z'
        }),
        createTestMessage({ 
          body: 'First response', 
          message_type: 'public',
          author_role: 'employee',
          created_at: '2024-01-01T00:01:00Z'
        }),
        createTestMessage({ 
          body: 'Second response', 
          message_type: 'public',
          author_role: 'employee',
          created_at: '2024-01-01T00:02:00Z'
        })
      ]

      // Insert messages with delay between each
      for (const msg of messages) {
        const { error } = await supabase.from('ticket_messages').insert(msg)
        expect(error).toBeNull()
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Process the first message (customer message)
      const success = await processNewMessage(convertToMessageContext(messages[0]))
      expect(success).toBe(true)

      // Wait for embedding to be processed
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verify context window includes all messages with correct formatting
      const { data: embedding } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('message_id', messages[0].id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(embedding).toBeDefined()
      const parsedEmbedding = JSON.parse(embedding.embedding)
      expect(embedding.context_window).toContain('CUSTOMER:')
      expect(embedding.context_window).toContain('EMPLOYEE:')
    }, 30000)
  })

  describe('Background Job', () => {
    it('should automatically process new messages via realtime subscription', async () => {
      // Setup realtime subscription
      const subscription = await setupConversationEmbeddingUpdates()
      expect(subscription).toBeDefined()

      // Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Insert a new message
      const message = createTestMessage()
      const { error: insertError } = await supabase
        .from('ticket_messages')
        .insert(message)
      
      expect(insertError).toBeNull()

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify embedding was created
      const { data: embedding } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('message_id', message.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(embedding).toBeDefined()
      const parsedEmbedding = JSON.parse(embedding.embedding)
      expect(Array.isArray(parsedEmbedding)).toBe(true)
      expect(parsedEmbedding.length).toBe(1536)

      // Cleanup
      await subscription.unsubscribe()
    }, 30000)
  })

  describe('Batch Processing', () => {
    it('should process existing messages that don\'t have embeddings', async () => {
      // Create multiple messages without embeddings
      const messages = Array.from({ length: 3 }, () => createTestMessage())
      
      for (const msg of messages) {
        const { error } = await supabase.from('ticket_messages').insert(msg)
        expect(error).toBeNull()
        // Wait between insertions to ensure proper ordering
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Track progress
      const progress: any[] = []
      await processExistingMessages((phase, completed, total) => {
        progress.push({ phase, completed, total })
      })

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify embeddings were created
      for (const msg of messages) {
        const { data: embedding } = await supabase
          .from('conversation_embeddings')
          .select('*')
          .eq('message_id', msg.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        expect(embedding).toBeDefined()
        const parsedEmbedding = JSON.parse(embedding.embedding)
        expect(Array.isArray(parsedEmbedding)).toBe(true)
        expect(parsedEmbedding.length).toBe(1536) // Verify correct embedding dimension
      }

      // Verify progress tracking
      expect(progress.length).toBeGreaterThan(0)
      expect(progress[progress.length - 1].completed).toBe(progress[progress.length - 1].total)
    }, 90000) // Increased timeout for batch processing

    it('should skip messages that already have embeddings', async () => {
      // Create a message and process it
      const message = createTestMessage()
      const { error } = await supabase.from('ticket_messages').insert(message)
      expect(error).toBeNull()
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      await processNewMessage(convertToMessageContext(message))
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Try processing again
      const progress: any[] = []
      await processExistingMessages((phase, completed, total) => {
        progress.push({ phase, completed, total })
      })

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify only one embedding exists
      const { data: embeddings } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('message_id', message.id)
        .order('created_at', { ascending: false })

      expect(embeddings).toHaveLength(1)
    }, 60000) // Increased timeout
  })

  describe('Cleanup', () => {
    it('should delete embeddings when messages are deleted', async () => {
      // Create and process a message
      const message = createTestMessage()
      const { error: insertError } = await supabase.from('ticket_messages').insert(message)
      expect(insertError).toBeNull()
      
      await processNewMessage(convertToMessageContext(message))
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verify embedding exists
      const { data: beforeDelete } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('message_id', message.id)
      expect(beforeDelete).toHaveLength(1)

      // Delete the message
      const { error: deleteError } = await supabase
        .from('ticket_messages')
        .delete()
        .eq('id', message.id)
      expect(deleteError).toBeNull()

      // Verify embedding was deleted
      const { data: afterDelete } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('message_id', message.id)
      expect(afterDelete).toHaveLength(0)
    }, 30000)

    it('should delete embeddings when tickets are deleted', async () => {
      // Create a new ticket and messages
      const newTicketId = uuidv4()
      const { error: ticketError } = await supabase
        .from('tickets')
        .insert({
          id: newTicketId,
          subject: 'Test Cleanup Ticket',
          user_id: testUserId,
          handling_org_id: testOrgId,
          status: 'open',
          priority: 'medium'
        })
      expect(ticketError).toBeNull()

      // Create multiple messages for this ticket
      const messages = Array.from({ length: 3 }, () => createTestMessage({ ticket_id: newTicketId }))
      for (const msg of messages) {
        const { error } = await supabase.from('ticket_messages').insert(msg)
        expect(error).toBeNull()
        await processNewMessage(convertToMessageContext(msg))
      }

      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verify embeddings exist
      const { data: beforeDelete } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('ticket_id', newTicketId)
      expect(beforeDelete?.length).toBe(3)

      // Delete the ticket
      const { error: deleteError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', newTicketId)
      expect(deleteError).toBeNull()

      // Verify all embeddings were deleted
      const { data: afterDelete } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('ticket_id', newTicketId)
      expect(afterDelete).toHaveLength(0)
    }, 60000)
  })
}) 
