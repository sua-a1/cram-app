'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { TicketWithDetails, TicketStatus, TicketPriority, CreateTicketInput, UpdateTicketInput } from '@/types/tickets'

// Create ticket form schema
const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'] as const),
  assigned_team: z.string().optional(),
  assigned_employee: z.string().optional(),
})

// Update ticket form schema
const updateTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100),
  description: z.string().optional(),
  status: z.enum(['open', 'in-progress', 'closed'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
  assigned_team: z.string().optional(),
  assigned_employee: z.string().optional(),
})

type CreateTicketFormValues = z.infer<typeof createTicketSchema>
type UpdateTicketFormValues = z.infer<typeof updateTicketSchema>

interface TicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTicketFormValues | UpdateTicketFormValues) => Promise<void>
  defaultValues?: Partial<CreateTicketFormValues | UpdateTicketFormValues>
  mode: 'create' | 'edit'
  isSubmitting?: boolean
}

export function TicketDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  defaultValues,
  mode,
  isSubmitting: externalSubmitting = false
}: TicketDialogProps) {
  const [internalSubmitting, setInternalSubmitting] = React.useState(false)
  const isSubmitting = externalSubmitting || internalSubmitting

  const form = useForm<CreateTicketFormValues | UpdateTicketFormValues>({
    resolver: zodResolver(mode === 'create' ? createTicketSchema : updateTicketSchema),
    defaultValues: {
      subject: '',
      description: '',
      priority: 'medium',
      status: 'open',
      ...defaultValues,
    },
  })

  // Reset form when dialog opens/closes or mode changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        subject: '',
        description: '',
        priority: 'medium',
        status: 'open',
        ...defaultValues,
      })
    }
  }, [open, mode, defaultValues, form])

  async function handleSubmit(data: CreateTicketFormValues | UpdateTicketFormValues) {
    try {
      setInternalSubmitting(true)
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to submit ticket:', error)
    } finally {
      setInternalSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Ticket' : 'Edit Ticket'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new support ticket.' 
              : 'Edit the ticket details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ticket subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the issue..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === 'create' ? 'Create Ticket' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 