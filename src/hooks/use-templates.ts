'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TicketTemplate } from '@/types/tickets';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
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
        .eq('org_id', userProfile.org_id)
        .order('created_at', { ascending: false });

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
      console.log('Fetched templates:', data);
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return () => {};

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile?.org_id) return () => {};

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
          (payload: RealtimePostgresChangesPayload<TicketTemplate>) => {
            console.log('Template change received:', payload.eventType, payload);
            
            // Handle different types of changes
            switch (payload.eventType) {
              case 'INSERT':
                setTemplates(prev => [payload.new as TicketTemplate, ...prev]);
                break;
              case 'UPDATE':
                setTemplates(prev => 
                  prev.map(template => 
                    template.id === payload.new.id ? payload.new as TicketTemplate : template
                  )
                );
                break;
              case 'DELETE':
                setTemplates(prev => {
                  console.log('Deleting template:', payload.old.id);
                  return prev.filter(template => template.id !== payload.old.id);
                });
                break;
              default:
                // For any other changes, just refetch
                fetchTemplates(filters);
            }
          }
        )
        .subscribe();

      return () => {
        console.log('Unsubscribing from templates changes');
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up template subscription:', error);
      return () => {};
    }
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