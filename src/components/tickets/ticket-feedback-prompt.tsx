'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { TicketFeedbackDialog } from './ticket-feedback-dialog';

interface TicketFeedbackPromptProps {
  ticketId: string;
  userId: string;
  hasFeedback: boolean;
}

export function TicketFeedbackPrompt({
  ticketId,
  userId,
  hasFeedback
}: TicketFeedbackPromptProps) {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  if (hasFeedback) {
    return null;
  }

  return (
    <>
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">
                Help us improve! Share your feedback about this ticket.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFeedbackDialog(true)}
            >
              Provide Feedback
            </Button>
          </div>
        </CardContent>
      </Card>

      <TicketFeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        ticketId={ticketId}
        userId={userId}
      />
    </>
  );
} 