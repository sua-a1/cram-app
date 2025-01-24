'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TicketWithDetails, TicketStatus, TicketPriority } from '@/types/tickets';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/supabase-auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const TICKET_STATUS_OPTIONS: TicketStatus[] = ['open', 'in-progress', 'closed'];
const TICKET_PRIORITY_OPTIONS: TicketPriority[] = ['low', 'medium', 'high'];

const STATUS_STYLES: Record<TicketStatus, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
  'open': { variant: 'default', label: 'Open' },
  'in-progress': { variant: 'secondary', label: 'In Progress' },
  'closed': { variant: 'outline', label: 'Closed' }
};

const PRIORITY_STYLES: Record<TicketPriority, { color: string, variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
  'low': { color: 'text-blue-500', variant: 'outline', label: 'Low Priority' },
  'medium': { color: 'text-yellow-500', variant: 'secondary', label: 'Medium Priority' },
  'high': { color: 'text-red-500', variant: 'destructive', label: 'High Priority' }
};

export default function TicketDetailPage() {
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTicket, setEditedTicket] = useState<TicketWithDetails | null>(null);
  const params = useParams();
  const router = useRouter();
  const { user, supabase } = useAuth();
  const { toast } = useToast();

  // Function to handle navigation
  const handleNavigation = (path: string) => {
    setTicket(null);
    setLoading(true);
    router.push(path);
  };

  // Function to fetch ticket data
  const fetchTicket = async (ticketId: string) => {
    try {
      if (!user) {
        console.log('No user found, redirecting to signin');
        handleNavigation('/org/org-auth/signin');
        return;
      }

      console.log('Fetching with user:', user.id);

      // Get user's organization
      const profileResult = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      console.log('Profile query result:', profileResult);

      if (profileResult.error) {
        console.error('Profile error:', profileResult.error);
        throw profileResult.error;
      }

      const profile = profileResult.data;
      if (!profile?.org_id) {
        console.log('No org_id found for user');
        handleNavigation('/org/org-auth/access');
        return;
      }

      console.log('Found org_id:', profile.org_id);

      // Fetch ticket with all related data
      const ticketResult = await supabase
        .from('tickets')
        .select(`
          id,
          subject,
          description,
          status,
          priority,
          user_id,
          handling_org_id,
          assigned_team,
          assigned_employee,
          created_at,
          updated_at,
          teams:tickets_assigned_team_fkey(name),
          assigned_employee:tickets_assigned_employee_fkey(display_name, role),
          creator:tickets_user_id_fkey(display_name, role)
        `)
        .eq('id', ticketId)
        .eq('handling_org_id', profile.org_id)
        .single();

      console.log('Ticket query result:', ticketResult);

      if (ticketResult.error) {
        console.error('Ticket error:', ticketResult.error);
        throw ticketResult.error;
      }

      if (!ticketResult.data) {
        console.log('No ticket found with ID:', ticketId);
        handleNavigation('/org/dashboard');
        return;
      }

      // Transform the data to match our types
      const transformedTicket: TicketWithDetails = {
        ...ticketResult.data,
        assigned_team_details: ticketResult.data.teams?.[0],
        assigned_employee_details: ticketResult.data.assigned_employee?.[0],
        creator: ticketResult.data.creator?.[0]
      };

      console.log('Setting ticket data:', transformedTicket);
      setTicket(transformedTicket);
    } catch (error: any) {
      console.error('Error in fetchTicket:', error);
      toast({
        title: 'Error loading ticket',
        description: error?.message || 'There was an error loading the ticket details. Please try again.',
        variant: 'destructive',
      });
      handleNavigation('/org/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Function to update ticket
  const updateTicket = async (updates: Partial<TicketWithDetails>) => {
    try {
      setSaving(true);

      // First check if the ticket still exists
      const { data: existingTicket, error: checkError } = await supabase
        .from('tickets')
        .select('id')
        .eq('id', ticket?.id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (!existingTicket) {
        throw new Error('Ticket no longer exists');
      }

      // Proceed with update
      const { error: updateError } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket?.id);

      if (updateError) {
        // Handle specific Postgrest errors
        if (updateError.code === 'PGRST116') {
          throw new Error('Ticket not found or you do not have permission to update it');
        }
        throw updateError;
      }

      // Refetch to get updated data
      await fetchTicket(ticket?.id as string);
      setIsEditing(false);
      setEditedTicket(null);

      toast({
        title: 'Ticket updated',
        description: 'The ticket has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      
      // Show more specific error messages
      const errorMessage = error.code === 'PGRST116' 
        ? 'The ticket could not be updated. It may have been deleted or you may not have permission to edit it.'
        : error?.message || 'There was an error updating the ticket. Please try again.';
      
      toast({
        title: 'Error updating ticket',
        description: errorMessage,
        variant: 'destructive',
      });

      // If ticket doesn't exist anymore, redirect to dashboard
      if (error.message === 'Ticket no longer exists') {
        handleNavigation('/org/dashboard');
        return;
      }
    } finally {
      setSaving(false);
    }
  };

  // Function to start editing
  const handleStartEdit = () => {
    setEditedTicket(ticket);
    setIsEditing(true);
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditedTicket(null);
    setIsEditing(false);
  };

  // Function to save changes
  const handleSaveChanges = async () => {
    if (!editedTicket || !ticket) return;
    
    const updates: Partial<TicketWithDetails> = {};
    
    // Only include fields that have actually changed
    if (editedTicket.subject !== ticket.subject) {
      updates.subject = editedTicket.subject;
    }
    if (editedTicket.description !== ticket.description) {
      updates.description = editedTicket.description;
    }
    if (editedTicket.status !== ticket.status) {
      updates.status = editedTicket.status;
    }
    if (editedTicket.priority !== ticket.priority) {
      updates.priority = editedTicket.priority;
    }

    if (Object.keys(updates).length > 0) {
      await updateTicket(updates);
    } else {
      // No changes made, just exit edit mode
      setIsEditing(false);
      setEditedTicket(null);
    }
  };

  // Initial fetch and subscription setup
  useEffect(() => {
    const ticketId = params.id as string;
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const initialize = async () => {
      if (!ticketId || !user) {
        setLoading(false);
        return;
      }

      console.log('Setting up ticket subscription for:', ticketId);
      
      // Initial fetch
      await fetchTicket(ticketId);

      // Set up real-time subscription
      channel = supabase
        .channel(`ticket-${ticketId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `id=eq.${ticketId}`
          },
          async (payload) => {
            console.log('Received ticket update:', payload);
            if (!mounted) return;

            if (payload.eventType === 'DELETE') {
              console.log('Ticket was deleted');
              handleNavigation('/org/dashboard');
              return;
            }
            
            await fetchTicket(ticketId);
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });
    };

    initialize();

    return () => {
      console.log('Cleaning up ticket subscription');
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [params.id, user, supabase]);

  console.log('Render state:', { loading, ticket, userId: user?.id });

  if (!user) {
    return (
      <div className="container py-6">
        <div className="h-[200px] rounded-lg border bg-muted animate-pulse" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Ticket not found</h2>
          <p className="text-muted-foreground mt-2">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => handleNavigation('/org/dashboard')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => handleNavigation('/org/dashboard')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to tickets
        </Button>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {ticket && (
            <>
              <Badge variant={STATUS_STYLES[ticket.status as TicketStatus].variant}>
                {STATUS_STYLES[ticket.status as TicketStatus].label}
              </Badge>
              <Badge variant={PRIORITY_STYLES[ticket.priority as TicketPriority].variant}>
                {PRIORITY_STYLES[ticket.priority as TicketPriority].label}
              </Badge>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Ticket Details</CardTitle>
          {!isEditing ? (
            <Button onClick={handleStartEdit}>
              Edit Ticket
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            {isEditing ? (
              <Input
                id="subject"
                value={editedTicket?.subject}
                onChange={(e) => setEditedTicket(prev => prev ? { ...prev, subject: e.target.value } : null)}
              />
            ) : (
              <p className="text-lg font-medium">{ticket?.subject}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={editedTicket?.description || ''}
                onChange={(e) => setEditedTicket(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">{ticket?.description || 'No description provided.'}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              {isEditing ? (
                <Select
                  value={editedTicket?.status}
                  onValueChange={(value: TicketStatus) => setEditedTicket(prev => prev ? { ...prev, status: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_STYLES[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1.5">
                <Badge variant={STATUS_STYLES[ticket?.status as TicketStatus]?.variant}>
                  {STATUS_STYLES[ticket?.status as TicketStatus]?.label}
                </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              {isEditing ? (
                <Select
                  value={editedTicket?.priority}
                  onValueChange={(value: TicketPriority) => setEditedTicket(prev => prev ? { ...prev, priority: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {PRIORITY_STYLES[priority].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1.5">
                <Badge variant={PRIORITY_STYLES[ticket?.priority as TicketPriority]?.variant}>
                  {PRIORITY_STYLES[ticket?.priority as TicketPriority]?.label}
                </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold">Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              {ticket?.assigned_team_details && (
                <div>
                  <Label className="text-sm text-muted-foreground">Team</Label>
                  <p>{ticket.assigned_team_details.name}</p>
                </div>
              )}
              {ticket?.assigned_employee_details && (
                <div>
                  <Label className="text-sm text-muted-foreground">Assigned to</Label>
                  <p>{ticket.assigned_employee_details.display_name}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Created by</Label>
            <p>{ticket?.creator?.display_name || 'Unknown'}</p>
            <div className="text-sm text-muted-foreground">
              Created: {ticket?.created_at && new Date(ticket.created_at).toLocaleString()}
              {ticket?.updated_at && ticket.updated_at !== ticket.created_at && (
                <> · Updated: {new Date(ticket.updated_at).toLocaleString()}</>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 