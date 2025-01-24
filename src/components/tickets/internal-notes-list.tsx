"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/supabase-auth-provider";
import type { InternalNoteWithMessage } from "@/types/tickets";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InternalNotesListProps {
  ticketId: string;
  className?: string;
  onGoToMessage?: (messageId: string) => void;
}

export function InternalNotesList({ 
  ticketId, 
  className,
  onGoToMessage 
}: InternalNotesListProps) {
  const [notes, setNotes] = useState<InternalNoteWithMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useAuth();

  useEffect(() => {
    let mounted = true;

    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase
          .from("internal_notes")
          .select(`
            *,
            related_message:ticket_messages(*)
          `)
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (mounted) {
          setNotes(data as InternalNoteWithMessage[]);
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNotes();

    // Set up real-time subscription
    const channel = supabase
      .channel("notes-list-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_notes",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-[600px]", className)}>
      <div className="space-y-4 p-4">
        {notes.map((note) => {
          const relatedMessage = note.related_message;
          
          return (
            <Card key={note.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{note.author_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(note.created_at), "PPp")}
                    </p>
                  </div>
                  {relatedMessage?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGoToMessage?.(relatedMessage.id)}
                      className="gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Go to Message
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  {note.content}
                </div>
                {relatedMessage?.body && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Related Message:
                    </p>
                    <Card className="p-3 bg-muted">
                      <p className="text-sm line-clamp-2">
                        {relatedMessage.body}
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
} 
