'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { SignInCredentials } from '@/types/auth'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}) satisfies z.ZodType<SignInCredentials>

type SignInValues = z.infer<typeof signInSchema>

export function OrgSignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get redirect URL from query params (using 'next' instead of 'redirect')
  const redirectUrl = searchParams.get('next') || '/org/dashboard'

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: SignInValues) {
    setIsLoading(true)

    const supabase = createClient()

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        throw signInError
      }

      if (!user) {
        throw new Error('No user returned after sign in')
      }

      // Check if user belongs to an organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, org_id, role, display_name')
        .eq('user_id', user.id)
        .single()

      // If there's a 404 or auth error, the user needs to set up organization access
      if (profileError?.code === '404' || profileError?.code === '401') {
        window.location.href = '/org/org-auth/access'
        return
      }

      // For other profile errors, throw them
      if (profileError) {
        throw profileError
      }

      // If no org_id or not an employee/admin, redirect to access page
      if (!profile?.org_id || (profile.role !== 'employee' && profile.role !== 'admin')) {
        window.location.href = '/org/org-auth/access'
        return
      }

      toast({
        title: 'Success',
        description: 'Welcome back!',
      })

      // Add a small delay to allow the toast to show
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Force a hard navigation to clear any stale state
      window.location.href = redirectUrl
    } catch (error) {
      console.error('Sign in error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      })
      // If it's an auth error, sign out
      if (error instanceof Error && error.message.includes('auth')) {
        await supabase.auth.signOut()
      }
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@organization.com"
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
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/org/org-auth/reset-password"
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
        Need organization access?{' '}
        <Link 
          href="/org/org-auth/register"
          className="text-primary underline-offset-4 hover:underline"
        >
          Register here
        </Link>
      </div>
    </div>
  )
} 