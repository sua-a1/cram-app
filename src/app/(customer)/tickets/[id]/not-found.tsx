import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Ticket Not Found</h1>
      <p className="text-muted-foreground">
        The ticket you are looking for does not exist or you do not have permission to view it.
      </p>
      <Button asChild>
        <Link href="/customer">Return to Dashboard</Link>
      </Button>
    </div>
  )
} 
