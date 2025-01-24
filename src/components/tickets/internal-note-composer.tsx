"use client";

import { useState } from "react";
import { useAuth } from "@/providers/supabase-auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TicketMessage } from "@/types/tickets";

interface InternalNoteComposerProps {
  ticketId: string;
  className?: string;
}

export function InternalNoteComposer({ ticketId, className }: InternalNoteComposerProps) {
  const [content, setContent] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const { supabase, user } = useAuth();
  const { toast } = useToast();

  // Fetch messages for linking
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data as TicketMessage[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      // Get user profile for author details
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      const noteData = {
        ticket_id: ticketId,
        author_id: user.id,
        author_name: profile.display_name,
        author_email: user.email,
        author_role: profile.role,
        content: content.trim(),
        related_ticket_message_id: selectedMessageId,
      };

      const { error } = await supabase
        .from("internal_notes")
        .insert([noteData]);

      if (error) throw error;

      setContent("");
      setSelectedMessageId(null);
      setShowLinkDialog(false);

      toast({
        title: "Note added",
        description: "Your internal note has been added successfully.",
      });
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast({
        title: "Error adding note",
        description: error?.message || "There was an error adding your note.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Add Internal Note</h3>
          <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  fetchMessages();
                }}
              >
                <Link className="h-4 w-4" />
                Link to Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link to Message</DialogTitle>
                <DialogDescription>
                  Select a message to link this note to.
                </DialogDescription>
              </DialogHeader>
              <Select
                value={selectedMessageId || ""}
                onValueChange={(value) => setSelectedMessageId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a message" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {messages.map((message) => (
                    <SelectItem key={message.id} value={message.id}>
                      {message.body.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DialogContent>
          </Dialog>
        </div>

        <Textarea
          placeholder="Type your internal note here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px]"
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedMessageId && "Linked to message"}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Note
          </Button>
        </div>
      </div>
    </Card>
  );
} 