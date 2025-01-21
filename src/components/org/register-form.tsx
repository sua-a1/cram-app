'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Building2, Loader2 } from 'lucide-react'

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
import { registerOrganization } from '@/app/(org)/register/actions'

// Validation schema
const registerSchema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  domain: z.string().optional(),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Initialize form
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      orgName: '',
      domain: '',
    },
  })

  async function onSubmit(data: RegisterValues) {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('orgName', data.orgName)
      if (data.domain) formData.append('domain', data.domain)

      const result = await registerOrganization(formData)

      if (result.error) {
        toast({
          title: 'Registration failed',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Organization registered',
        description: 'Your organization has been registered successfully.',
      })

      // Redirect to dashboard
      router.push('/dashboard')
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
          name="orgName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="acme.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={isLoading} type="submit" className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              Register Organization
            </>
          )}
        </Button>
      </form>
    </Form>
  )
} 