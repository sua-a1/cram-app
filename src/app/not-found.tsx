'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-6">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-2xl font-semibold">Page not found</h2>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
} 