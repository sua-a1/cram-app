'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/hooks/use-toast';
import { MessageType, TicketMessageData } from '@/types/tickets';
import { Lock, Mail, MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageComposerProps {
  ticketId: string;
  onSend: (data: TicketMessageData) => Promise<void>;
  defaultTemplate?: string;
  isSubmitting?: boolean;
}

export function MessageComposer({
  ticketId,
  onSend,
  defaultTemplate,
  isSubmitting = false,
}: MessageComposerProps) {
  const [messageType, setMessageType] = useState<MessageType>('public');
  const [isEmail, setIsEmail] = useState(false);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [StarterKit],
    content: defaultTemplate || '',
    editorProps: {
      attributes: {
        class: 'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
  });

  const handleSend = async () => {
    if (!editor?.getText().trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSend({
        ticketId,
        body: editor.getHTML(),
        messageType,
        isEmail,
      });

      editor.commands.setContent('');
      setMessageType('public');
      setIsEmail(false);

      toast({
        title: 'Success',
        description: 'Message sent successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center gap-4">
        <Select
          value={messageType}
          onValueChange={(value) => setMessageType(value as MessageType)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Message Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Public
              </div>
            </SelectItem>
            <SelectItem value="internal">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Internal
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Toggle
          pressed={isEmail}
          onPressedChange={setIsEmail}
          className={cn(
            'gap-2',
            isEmail && 'bg-secondary text-secondary-foreground'
          )}
        >
          <Mail className="h-4 w-4" />
          Send as Email
        </Toggle>
      </div>

      <EditorContent editor={editor} />

      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={isSubmitting}>
          <Send className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </div>
    </div>
  );
} 