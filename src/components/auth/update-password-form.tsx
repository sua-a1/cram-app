'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { updatePassword } from '@/lib/server/auth-logic'
import { useToast } from '@/hooks/use-toast'

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get the code from URL
  const code = searchParams.get('code')

  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: UpdatePasswordValues) {
    if (!code) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing reset code. Please use the reset link from your email.',
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await updatePassword({ 
        password: data.password,
        code
      })

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
        description: 'Your password has been updated. Please sign in with your new password.',
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
            name="password"
            render={({ field }: { field: ControllerRenderProps<UpdatePasswordValues, "password"> }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }: { field: ControllerRenderProps<UpdatePasswordValues, "confirmPassword"> }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="new-password"
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
            Update password
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