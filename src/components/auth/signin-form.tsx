'use client'

import { useState } from 'react'
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
import { signInAction } from '@/app/(auth)/signin/actions'
import { useToast } from '@/hooks/use-toast'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInValues = z.infer<typeof signInSchema>

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: SignInValues) {
    setIsLoading(true)
    console.log('Starting sign in...')

    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)

      const result = await signInAction(formData)
      console.log('Sign in result:', result)

      if (result?.error) {
        console.error('Sign in error:', result.error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        })
        return
      }

      if (result?.success) {
        toast({
          title: 'Success',
          description: 'Welcome back!',
        })

        // Add a small delay to allow the toast to show
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push(redirectUrl)
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
            name="email"
            render={({ field }: { field: ControllerRenderProps<SignInValues, "email"> }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }: { field: ControllerRenderProps<SignInValues, "password"> }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/reset-password"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="current-password"
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
            Sign in
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Don't have an account?{' '}
        <Link 
          href={{
            pathname: '/signup',
            query: redirectUrl !== '/dashboard' ? { redirect: redirectUrl } : undefined
          }}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
} 