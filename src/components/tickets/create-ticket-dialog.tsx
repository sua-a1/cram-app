import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createTicket } from '@/app/actions/tickets';

export function CreateTicketDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;

    try {
      await createTicket({ subject, description });
      toast({
        title: 'Success',
        description: 'Ticket created successfully',
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating ticket';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Ticket</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Fill in the details for your new support ticket.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Brief description of the issue"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed description of the issue"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
        <div role="alert" aria-live="polite" className="sr-only">
          {isLoading ? 'Creating ticket...' : ''}
        </div>
        <div role="alert" aria-live="polite" className="sr-only">
          Ticket created successfully
        </div>
        <div role="alert" aria-live="polite" className="sr-only">
          Error creating ticket
        </div>
      </DialogContent>
    </Dialog>
  );
} 
