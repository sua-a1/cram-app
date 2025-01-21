'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type ControllerRenderProps } from 'react-hook-form'
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
import { resetPassword } from '@/lib/server/auth-logic'
import { useToast } from '@/hooks/use-toast'

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ResetPasswordValues) {
    setIsLoading(true)

    try {
      const result = await resetPassword(data)

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Password reset email sent. Please check your inbox.',
      })

      router.push('/signin')
    } catch (error) {
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
            name="email"
            render={({ field }: { field: ControllerRenderProps<ResetPasswordValues, "email"> }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send reset link
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Remember your password?{' '}
        <Link href="/signin" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
} 