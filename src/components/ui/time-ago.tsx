'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TimeAgoProps {
  date: Date | string;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    // Only set the time ago text on the client side
    setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix: true }));

    // Update every minute
    const interval = setInterval(() => {
      setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix: true }));
    }, 60000);

    return () => clearInterval(interval);
  }, [date]);

  // Don't render anything during SSR
  if (!timeAgo) {
    return null;
  }

  return (
    <time dateTime={new Date(date).toISOString()} className={className}>
      {timeAgo}
    </time>
  );
} 