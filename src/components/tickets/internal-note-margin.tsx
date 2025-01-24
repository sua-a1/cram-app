"use client";

import { InternalNoteWithMessage } from "@/types/tickets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface InternalNoteMarginProps {
  note: InternalNoteWithMessage;
  onGoToNote: () => void;
}

export function InternalNoteMargin({ note, onGoToNote }: InternalNoteMarginProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card className="p-3 mb-2 cursor-pointer hover:bg-accent">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{note.author_name}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoToNote();
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {note.content}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(note.created_at), "PP")}
            </p>
          </div>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{note.author_name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(note.created_at), "PPp")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToNote}
              className="gap-1"
            >
              View in Notes
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm">{note.content}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
} 