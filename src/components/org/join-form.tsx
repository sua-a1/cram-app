'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { LogIn, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { joinAction } from '@/app/org/(routes)/org-auth/access/actions'

// Validation schema
const joinSchema = z.object({
  organizationId: z.string().uuid('Please enter a valid organization ID'),
})

type JoinValues = z.infer<typeof joinSchema>

export function OrgJoinForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Initialize form
  const form = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      organizationId: '',
    },
  })

  async function onSubmit(data: JoinValues) {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('organizationId', data.organizationId)

      const result = await joinAction(formData)

      if (result?.error) {
        toast({
          title: 'Failed to join organization',
          description: result.error.message || 'Please try again later.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Successfully joined organization',
        description: `You have joined ${result.organizationName}`,
      })

      // Note: No need to redirect here as the server action handles it
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter organization ID" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={isLoading} type="submit" className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Join Organization
            </>
          )}
        </Button>
      </form>
    </Form>
  )
} 