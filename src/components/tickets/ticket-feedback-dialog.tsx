'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { submitFeedback } from '@/app/actions/tickets';
import { Loader2 } from 'lucide-react';

interface TicketFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  userId: string;
}

export function TicketFeedbackDialog({
  open,
  onOpenChange,
  ticketId,
  userId,
}: TicketFeedbackDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitFeedback({
        ticketId,
        userId,
        rating,
        feedback: feedback.trim() || undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
      });

      // Reset form and close dialog
      setRating(0);
      setFeedback('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ticket Feedback</DialogTitle>
          <DialogDescription>
            Please rate your experience and provide any additional feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="icon"
                onClick={() => setRating(value)}
                className={cn(
                  'hover:bg-accent hover:text-accent-foreground',
                  rating >= value && 'text-yellow-500 hover:text-yellow-600'
                )}
              >
                <Star className="h-6 w-6" />
              </Button>
            ))}
          </div>
          <div className="grid gap-2">
            <Textarea
              id="feedback"
              placeholder="Additional comments (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
