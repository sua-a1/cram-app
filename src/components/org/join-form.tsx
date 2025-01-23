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
      console.log('Submitting join form...')
      const formData = new FormData()
      formData.append('organizationId', data.organizationId)

      const result = await joinAction(formData)
      console.log('Join action result:', result)

      if (!result) {
        throw new Error('No response from server')
      }

      if ('error' in result && result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: result.message || 'Successfully joined organization',
      })

      // Redirect to dashboard after successful join
      router.push('/org/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Join error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
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