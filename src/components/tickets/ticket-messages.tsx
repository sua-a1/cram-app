import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';
import type { TicketMessage, MessageType, InternalNoteWithMessage } from '@/types/tickets';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { InfoIcon, ChevronRight, MessageSquare, Plus, Loader2 } from 'lucide-react';
import { MessageComposer } from './message-composer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/supabase-auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface TicketMessagesProps {
  messages: TicketMessage[];
  currentUserId: string;
  onSendMessage: (message: { body: string; messageType: MessageType }) => Promise<void>;
  className?: string;
  disabled?: boolean;
  onGoToNote?: (noteId: string) => void;
  currentView?: 'messages' | 'notes';
  onViewChange?: (view: 'messages' | 'notes') => void;
}

interface MessageItemProps {
  message: TicketMessage;
  isCurrentUser: boolean;
  notes?: InternalNoteWithMessage[];
  onGoToNote?: (noteId: string) => void;
  onAddNote?: (messageId: string, content: string) => Promise<void>;
  onEditNote?: (noteId: string, content: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  currentUserId: string;
  id?: string;
}

function MessageItem({ message, isCurrentUser, notes = [], onGoToNote, onAddNote, onEditNote, onDeleteNote, currentUserId, id }: MessageItemProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const handleAddNote = async () => {
    if (!noteContent.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddNote?.(message.id, noteContent);
      setNoteContent('');
      setIsAddingNote(false);
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (noteId: string, content: string) => {
    try {
      await onEditNote?.(noteId, content);
      setEditingNoteId(null);
      setEditedContent('');
    } catch (error) {
      console.error('Error editing note:', error);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await onDeleteNote?.(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const displayName = isCurrentUser 
    ? 'You' 
    : message.author_role === 'customer'
      ? message.author_name || 'Unknown Customer'
      : message.author?.display_name || 'Unknown User';

  const avatarInitial = isCurrentUser 
    ? 'Y' 
    : message.author_role === 'customer'
      ? (message.author_name?.[0] || 'C')
      : message.author?.display_name?.[0] || 'U';

  return (
    <div className="flex">
      {/* Left Margin - Very narrow */}
      <div className="w-[48px] flex-shrink-0 bg-[#f1f3f4]" />

      {/* Main Message Area */}
      <div className={cn(
        'flex-1 flex gap-3 p-4 group/message relative bg-white',
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {avatarInitial}
          </AvatarFallback>
        </Avatar>
        
        <div className={cn(
          'flex flex-col relative',
          isCurrentUser ? 'items-end' : 'items-start',
          'max-w-[85%]'
        )}>
          <div className="mb-1">
            <span className="text-sm font-medium">
              {displayName}
            </span>
            {message.author_role === 'customer' && message.author_email && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({message.author_email})
              </span>
            )}
            {message.author?.role && message.author_role !== 'customer' && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({message.author.role})
              </span>
            )}
          </div>

          <div className={cn(
            'rounded-lg p-3 group-hover:pr-8',
            isCurrentUser 
              ? 'bg-primary text-primary-foreground [&_.prose]:text-primary-foreground [&_.prose_a]:text-primary-foreground [&_.prose_strong]:text-primary-foreground [&_.prose_img]:max-w-full [&_.prose_img]:rounded-md' 
              : 'bg-muted [&_.prose]:text-foreground [&_.prose_img]:max-w-full [&_.prose_img]:rounded-md',
            message.message_type === 'internal' && 'border-2 border-yellow-500'
          )}>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_img]:!my-2 [&_img]:inline-block [&_img]:!max-h-[300px] [&_img]:object-contain"
              dangerouslySetInnerHTML={{ __html: message.body }} 
            />
            <HoverCard>
              <HoverCardTrigger asChild>
                <button className={cn(
                  "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                  isCurrentUser ? "left-2" : "right-2"
                )}>
                  <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent 
                className="w-80" 
                align={isCurrentUser ? "start" : "end"}
                side="top"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Message Details</h4>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(message.created_at), 'PPpp')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source:</span>
                      <span className="capitalize">{message.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">{message.message_type}</span>
                    </div>
                    {message.is_email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>Yes</span>
                      </div>
                    )}
                    {message.external_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">External ID:</span>
                        <span className="font-mono text-[10px]">{message.external_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          
          <div className={cn(
            'flex gap-2 mt-1 text-xs text-muted-foreground',
            isCurrentUser ? 'flex-row-reverse' : 'flex-row'
          )}>
            <time>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </time>
            {message.message_type === 'internal' && (
              <span className="text-yellow-500">(Internal Note)</span>
            )}
            {message.is_email && (
              <span className="text-blue-500">(Email)</span>
            )}
            {message.source !== 'web' && (
              <span className="text-blue-500">({message.source})</span>
            )}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 px-0 text-xs hover:bg-transparent hover:text-blue-600"
                >
                  See details
                </Button>
              </HoverCardTrigger>
              <HoverCardContent 
                className="w-80" 
                align={isCurrentUser ? "end" : "start"}
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Message Details</h4>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(message.created_at), 'PPpp')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source:</span>
                      <span className="capitalize">{message.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">{message.message_type}</span>
                    </div>
                    {message.is_email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>Yes</span>
                      </div>
                    )}
                    {message.external_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">External ID:</span>
                        <span className="font-mono text-[10px]">{message.external_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Add Note Button - Show below message on hover */}
          <div className={cn(
            "mt-2 opacity-0 group-hover/message:opacity-100 transition-opacity",
            isCurrentUser ? "text-right" : "text-left"
          )}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setIsAddingNote(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add comment
            </Button>
          </div>
        </div>
      </div>

      {/* Right Margin - Notes */}
      <div className="w-[280px] flex-shrink-0 bg-[#f1f3f4]">
        {/* Note Composer */}
        {isAddingNote && (
          <div className="mx-4 mt-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">You</span>
                </div>
                <Textarea
                  placeholder="Add a comment..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 shadow-none text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 px-3 py-2 border-t bg-[#f8f9fa]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs hover:bg-gray-200"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNoteContent('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 bg-blue-600 hover:bg-blue-700 text-xs"
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Sending...
                    </>
                  ) : (
                    'Comment'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Notes */}
        {notes.length > 0 && (
          <div className="space-y-2 mx-4 mt-4">
            {notes.map((note) => (
              <div key={note.id} className="group bg-white rounded-lg p-2.5 hover:bg-[#f8f9fa] shadow-sm">
                <div className="flex items-start gap-2">
                  <Avatar className="h-5 w-5 mt-0.5">
                    <AvatarFallback>{note.author_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-medium text-gray-900">{note.author_name}</p>
                      <p className="text-[10px] text-gray-500 whitespace-nowrap">
                        {format(new Date(note.created_at), "PP")}
                      </p>
                    </div>
                    {editingNoteId === note.id ? (
                      <div className="mt-0.5">
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[60px] text-xs resize-none"
                          placeholder="Edit your note..."
                        />
                        <div className="flex justify-end gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditedContent('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => handleEdit(note.id, editedContent)}
                            disabled={!editedContent.trim() || editedContent === note.content}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-0.5 text-xs text-gray-700">
                          {note.content}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 text-[10px] hover:bg-gray-100 text-blue-600"
                            onClick={() => onGoToNote?.(note.id)}
                          >
                            View Details
                          </Button>
                          {note.author_id === currentUserId && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 text-[10px] hover:bg-gray-100"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditedContent(note.content);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 text-[10px] hover:bg-red-100 hover:text-red-600"
                                onClick={() => handleDelete(note.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketMessages({ 
  messages, 
  currentUserId, 
  onSendMessage,
  className,
  disabled = false,
  onGoToNote,
  currentView = 'messages',
  onViewChange
}: TicketMessagesProps) {
  const [notes, setNotes] = useState<InternalNoteWithMessage[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);
  const initialLoadRef = useRef(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const ITEMS_PER_PAGE = 20;

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'instant'
      });
    }
  }, []);

  // Function to scroll to a specific element
  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the element briefly
      element.style.backgroundColor = '#fef3c7';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  }, []);

  const handleViewMessage = (note: InternalNoteWithMessage) => {
    if (note.related_ticket_message_id) {
      setTargetMessageId(note.related_ticket_message_id);
      onViewChange?.('messages');
    }
  };

  const handleViewDetails = (noteId: string) => {
    onViewChange?.('notes');
    // After view switch, scroll to note
    setTimeout(() => {
      scrollToElement(`note-${noteId}`);
    }, 100);
  };

  // Handle scroll for infinite loading
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    if (scrollTop === 0 && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  // Fetch notes with pagination
  const fetchNotes = useCallback(async () => {
    if (!messages.length || loading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("internal_notes")
        .select(`
          *,
          related_message:ticket_messages(*)
        `)
        .eq("ticket_id", messages[0].ticket_id)
        .order("created_at", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setNotes(prev => {
        const newNotes = [...prev];
        data.forEach(note => {
          if (!newNotes.find(n => n.id === note.id)) {
            newNotes.push(note as InternalNoteWithMessage);
          }
        });
        return newNotes.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  }, [messages, page, loading, supabase]);

  // Update the main subscription to handle all changes properly
  useEffect(() => {
    if (!messages.length) return;

    let mounted = true;
    const ticketId = messages[0].ticket_id;
    const channelName = `notes-channel-${ticketId}-${Date.now()}`;
    console.log('Setting up subscription on channel:', channelName);

    // Set up real-time subscription for notes
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "internal_notes",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          console.log('Received DELETE event:', payload);
          if (mounted) {
            const deletedNoteId = payload.old.id;
            console.log('Deleting note with ID:', deletedNoteId);
            
            setNotes(prev => {
              console.log('Current notes:', prev.map(n => n.id));
              const filtered = prev.filter(note => note.id !== deletedNoteId);
              console.log('Notes after filter:', filtered.map(n => n.id));
              return filtered;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_notes",
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          console.log('Received INSERT event:', payload);
          if (mounted) {
            const { data, error } = await supabase
              .from("internal_notes")
              .select(`
                *,
                related_message:ticket_messages(*)
              `)
              .eq("id", payload.new.id)
              .single();

            if (!error && data) {
              setNotes(prev => {
                const newNotes = [...prev];
                const index = newNotes.findIndex(n => n.id === data.id);
                if (index === -1) {
                  newNotes.push(data as InternalNoteWithMessage);
                }
                return newNotes.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "internal_notes",
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          console.log('Received UPDATE event:', payload);
          if (mounted) {
            const { data, error } = await supabase
              .from("internal_notes")
              .select(`
                *,
                related_message:ticket_messages(*)
              `)
              .eq("id", payload.new.id)
              .single();

            if (!error && data) {
              setNotes(prev => {
                const newNotes = prev.map(note => 
                  note.id === payload.new.id ? (data as InternalNoteWithMessage) : note
                );
                return newNotes.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Initial fetch
    fetchNotes();

    return () => {
      console.log('Cleaning up subscription on channel:', channelName);
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [messages, supabase, fetchNotes]);

  // Initial scroll behavior
  useEffect(() => {
    if (currentView === 'messages') {
      if (targetMessageId) {
        // If we have a target message (coming from internal notes view)
        setTimeout(() => {
          scrollToElement(`message-${targetMessageId}`);
          setTargetMessageId(null);
        }, 200);
      } else if (initialLoadRef.current) {
        // On initial load, scroll to bottom
        setTimeout(scrollToBottom, 100);
        initialLoadRef.current = false;
      }
    }
  }, [currentView, targetMessageId, scrollToBottom, scrollToElement]);

  // Scroll to bottom only for new messages
  useEffect(() => {
    if (currentView === 'messages' && !targetMessageId && !initialLoadRef.current) {
      scrollToBottom();
    }
  }, [messages.length, currentView, targetMessageId, scrollToBottom]);

  const getNotesForMessage = (messageId: string) => {
    return notes.filter((note) => note.related_ticket_message_id === messageId);
  };

  const handleEditNote = async (noteId: string, content: string) => {
    try {
      // Optimistically update the UI first
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, content, updated_at: new Date().toISOString() }
          : note
      ));

      const { error } = await supabase
        .from("internal_notes")
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq("id", noteId)
        .eq("author_id", currentUserId);

      if (error) throw error;

      setEditingNoteId(null);
      setEditedContent('');

      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
    } catch (error: any) {
      // Revert the optimistic update on error
      fetchNotes();
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update note. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      console.log('Attempting to delete note:', noteId);
      
      const { error } = await supabase
        .from("internal_notes")
        .delete()
        .eq("id", noteId)
        .eq("author_id", currentUserId)
        .single();

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      // Update state immediately after successful deletion
      setNotes(prev => {
        console.log('Current notes before delete:', prev.map(n => n.id));
        const filtered = prev.filter(note => note.id !== noteId);
        console.log('Notes after delete:', filtered.map(n => n.id));
        return filtered;
      });

      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async (messageId: string | null, content: string) => {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name, role, email')
        .eq('user_id', currentUserId)
        .single();

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Add the note
      const { error: insertError } = await supabase
        .from("internal_notes")
        .insert({
          ticket_id: messages[0].ticket_id,
          content,
          // Only set related_ticket_message_id if messageId is provided (margin notes)
          ...(messageId ? { related_ticket_message_id: messageId } : {}),
          author_id: currentUserId,
          author_name: userProfile.display_name,
          author_email: userProfile.email,
          author_role: userProfile.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      toast({
        title: "Note added",
        description: "Your note has been added successfully.",
      });
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add note. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <Card className={cn('flex flex-col h-[600px] overflow-hidden', className)}>
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {currentView === 'messages' ? (
          <div className="flex flex-col">
            {loading && page > 1 && (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            )}
            {[...messages].reverse().map((message) => (
              <MessageItem 
                key={message.id}
                message={message}
                isCurrentUser={message.author_id === currentUserId}
                notes={getNotesForMessage(message.id)}
                onGoToNote={handleViewDetails}
                onAddNote={handleAddNote}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                currentUserId={currentUserId}
                id={`message-${message.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {loading && page > 1 && (
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            )}
            {notes.map((note) => (
              <Card key={note.id} id={`note-${note.id}`} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{note.author_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(note.created_at), "PPp")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {note.related_message && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMessage(note)}
                          className="gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          View Message
                        </Button>
                      )}
                      {note.author_id === currentUserId && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditedContent(note.content);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              console.log('Delete button clicked for note:', note.id);
                              handleDeleteNote(note.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {editingNoteId === note.id ? (
                    <div>
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[100px]"
                        placeholder="Edit your note..."
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditedContent('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleEditNote(note.id, editedContent)}
                          disabled={!editedContent.trim() || editedContent === note.content}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{note.content}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t">
        {currentView === 'messages' ? (
          <MessageComposer
            ticketId={messages[0]?.ticket_id}
            onSendMessage={onSendMessage}
            disabled={disabled}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">Add Internal Note</span>
              </div>
              <Textarea
                placeholder="Type your internal note here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 px-3 py-2 border-t bg-[#f8f9fa]">
              <Button
                size="sm"
                className="h-7 bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  if (!noteContent.trim()) return;
                  try {
                    // Pass null for messageId since this is a standalone note
                    await handleAddNote(null, noteContent);
                    setNoteContent('');
                  } catch (error) {
                    console.error('Error adding note:', error);
                  }
                }}
                disabled={!noteContent.trim() || disabled}
              >
                Add Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 