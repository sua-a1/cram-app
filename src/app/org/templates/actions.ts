'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/server/supabase';
import { revalidatePath } from 'next/cache';
import type { TicketTemplate } from '@/types/tickets';

type CreateTemplateInput = {
  name: string;
  content: string;
  category?: string | null;
  is_shared?: boolean;
};

export async function createTemplate(data: CreateTemplateInput) {
  const serviceClient = createServiceClient();
  const supabase = createServerSupabaseClient();

  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    throw new Error('Not authenticated');
  }

  // Get user's profile with org_id
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('org_id')
    .eq('user_id', session.user.id)
    .single();

  if (profileError || !profile?.org_id) {
    throw new Error('No organization found');
  }

  // Create the template
  const { data: template, error: templateError } = await serviceClient
    .from('ticket_message_templates')
    .insert({
      name: data.name,
      content: data.content,
      category: data.category,
      is_shared: data.is_shared,
      org_id: profile.org_id,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (templateError) {
    throw new Error(`Failed to create template: ${templateError.message}`);
  }

  revalidatePath('/org/templates');
  return template;
}

export async function updateTemplate(id: string, data: Partial<TicketTemplate>) {
  const serviceClient = createServiceClient();
  const supabase = createServerSupabaseClient();

  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    throw new Error('Not authenticated');
  }

  // Get user's profile with org_id
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('org_id')
    .eq('user_id', session.user.id)
    .single();

  if (profileError || !profile?.org_id) {
    throw new Error('No organization found');
  }

  // Update the template
  const { data: template, error: templateError } = await serviceClient
    .from('ticket_message_templates')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('org_id', profile.org_id) // Ensure template belongs to user's org
    .select()
    .single();

  if (templateError) {
    throw new Error(`Failed to update template: ${templateError.message}`);
  }

  revalidatePath('/org/templates');
  return template;
}

export async function deleteTemplate(id: string) {
  const serviceClient = createServiceClient();
  const supabase = createServerSupabaseClient();

  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    throw new Error('Not authenticated');
  }

  // Get user's profile with org_id
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('org_id')
    .eq('user_id', session.user.id)
    .single();

  if (profileError || !profile?.org_id) {
    throw new Error('No organization found');
  }

  // Delete the template
  const { error: deleteError } = await serviceClient
    .from('ticket_message_templates')
    .delete()
    .eq('id', id)
    .eq('org_id', profile.org_id); // Ensure template belongs to user's org

  if (deleteError) {
    throw new Error(`Failed to delete template: ${deleteError.message}`);
  }

  revalidatePath('/org/templates');
} 