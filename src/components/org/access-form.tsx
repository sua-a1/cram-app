'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { joinOrganizationAction } from '@/app/(org)/(org-auth)/access/actions'
import { useAuth } from '@/hooks/use-auth'

const accessSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  role: z.string(),
})

type AccessValues = z.infer<typeof accessSchema>

export function OrgAccessForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const form = useForm<AccessValues>({
    resolver: zodResolver(accessSchema),
    defaultValues: {
      organizationId: '',
      role: '',
    },
  })

  async function onSubmit(data: AccessValues) {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('organizationId', data.organizationId)
      formData.append('role', data.role)
      
      const result = await joinOrganizationAction(formData)

      if (result?.error) {
        console.error('Join organization error:', result.error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Successfully joined organization.',
      })

      // Redirect to role-specific dashboard
      if (data.role === 'admin') {
        router.push(`/${data.organizationId}/admin`)
      } else {
        router.push(`/${data.organizationId}/employee`)
      }
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
            name="organizationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your organization ID"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join Organization
          </Button>
        </form>
      </Form>

      {user?.role === 'admin' && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <Link href="/org/(org-auth)/register">
              Register New Organization
            </Link>
          </Button>
        </>
      )}
    </div>
  )
} 