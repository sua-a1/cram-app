'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { registerAction } from '@/app/org/(routes)/org-auth/register/actions'

const registrationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
})

type RegistrationValues = z.infer<typeof registrationSchema>

export function OrgRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
    },
  })

  async function onSubmit(data: RegistrationValues) {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      
      const result = await registerAction(formData)

      if (result?.error) {
        console.error('Registration error:', result.error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        })
        return
      }

      if (!result.success || !result.organizationId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create organization',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Organization created successfully.',
      })

      // Copy org ID to clipboard
      await navigator.clipboard.writeText(result.organizationId)
      toast({
        title: 'Organization ID Copied',
        description: 'Your organization ID has been copied to clipboard.',
      })

      // Redirect to dashboard
      router.push(`/${result.organizationId}/dashboard`)
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Acme Inc."
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This will be your organization's display name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Organization
          </Button>
        </form>
      </Form>
    </div>
  )
} 