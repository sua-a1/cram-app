'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/supabase-auth-provider'

// Form schema for customer ticket creation
const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject must be less than 100 characters'),
  description: z.string().min(1, 'Description is required'),
  handling_org_id: z.string().min(1, 'Please select an organization'),
})

type CreateTicketFormValues = z.infer<typeof createTicketSchema>

export default function NewTicketPage() {
  const router = useRouter()
  const { user, supabase } = useAuth()
  const { toast } = useToast()
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)

  // Initialize form
  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: '',
      description: '',
      handling_org_id: '',
    },
  })

  // Fetch available organizations
  useEffect(() => {
    async function fetchOrganizations() {
      setIsLoadingOrgs(true)
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('status', 'active')
          .order('name')

        if (error) {
          console.error('Error fetching organizations:', error)
          throw error
        }

        console.log('Organizations fetched:', data)
        setOrganizations(data || [])
      } catch (error: any) {
        console.error('Error in fetchOrganizations:', error)
        toast({
          title: 'Error',
          description: 'Failed to load organizations. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingOrgs(false)
      }
    }

    fetchOrganizations()
  }, [supabase, toast])

  // Handle form submission
  async function onSubmit(data: CreateTicketFormValues) {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a ticket.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          subject: data.subject,
          description: data.description,
          handling_org_id: data.handling_org_id,
          status: 'open',
          priority: 'medium',
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Your ticket has been created successfully.',
      })

      router.refresh()
      router.push('/customer')
    } catch (error: any) {
      console.error('Error creating ticket:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-muted-foreground">Submit a new support request</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Support Ticket</CardTitle>
          <CardDescription>
            Please provide details about your request. We'll get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="handling_org_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoadingOrgs}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingOrgs ? "Loading organizations..." : "Select an organization"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.length === 0 && !isLoadingOrgs && (
                          <SelectItem value="" disabled>No organizations available</SelectItem>
                        )}
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of your request" {...field} />
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
                        placeholder="Please provide detailed information about your request"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/customer')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isLoadingOrgs}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Ticket
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 