'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TicketTemplate } from '@/types/tickets';

type TemplateFilters = {
  search?: string;
  category?: string;
};

export function useTemplates() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [filters, setFilters] = useState<TemplateFilters>({});
  const supabase = createClient();

  const fetchTemplates = async (newFilters?: TemplateFilters) => {
    setLoading(true);
    setError(null);
    try {
      // Get user's organization first
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Not authenticated');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', profile.user.id)
        .single();

      if (!userProfile?.org_id) throw new Error('No organization found');

      // Build the query
      let query = supabase
        .from('ticket_message_templates')
        .select(`
          *,
          creator:profiles!ticket_message_templates_created_by_fkey(
            display_name,
            role
          )
        `)
        .eq('org_id', userProfile.org_id);

      // Apply filters
      if (newFilters?.category) {
        query = query.eq('category', newFilters.category);
      }
      if (newFilters?.search) {
        query = query.or(`name.ilike.%${newFilters.search}%,content.ilike.%${newFilters.search}%`);
      }

      // Execute query
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<TemplateFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchTemplates(updatedFilters);
  };

  // Subscribe to template changes
  const subscribeToTemplates = async () => {
    const { data: profile } = await supabase.auth.getUser();
    if (!profile.user) return;

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('user_id', profile.user.id)
      .single();

    if (!userProfile?.org_id) return;

    const channel = supabase
      .channel('templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_message_templates',
          filter: `org_id=eq.${userProfile.org_id}`,
        },
        () => {
          // Refetch templates when any change occurs
          fetchTemplates(filters);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    templates,
    loading,
    error,
    filters,
    updateFilters,
    fetchTemplates,
    subscribeToTemplates,
  };
} 