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
import { signUpAction } from '@/app/(auth)/signup/actions'
import { useToast } from '@/hooks/use-toast'

// Add a simple debug component
function Debug({ value }: { value: any }) {
  useEffect(() => {
    console.log('Debug component mounted with value:', value)
  }, [value])
  return null
}

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
})

type SignUpValues = z.infer<typeof signUpSchema>

export function SignUpForm() {
  useEffect(() => {
    console.log('SignUpForm mounted')
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect')

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      display_name: '',
    },
  })

  // Debug form errors
  const formState = form.formState
  console.log('Form errors:', formState.errors)

  async function onSubmit(data: SignUpValues) {
    setIsLoading(true)
    console.log('Form submission started with data:', data)

    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('display_name', data.display_name)
      
      const result = await signUpAction(formData)
      console.log('SignUpAction result:', result)

      if (result?.error) {
        console.error('SignUp error:', result.error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Your account has been created. Please sign in.',
      })

      // Redirect after successful signup
      router.push(redirectUrl ? `/signin?redirect=${encodeURIComponent(redirectUrl)}` : '/signin')
    } catch (error) {
      console.error('Unexpected error during sign up:', error)
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
      <Debug value="form-mounted" />
      <Form {...form}>
        <form 
          onSubmit={(e) => {
            console.log('Form submit event triggered')
            form.handleSubmit(onSubmit)(e)
          }} 
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: ControllerRenderProps<SignUpValues, "email"> }) => (
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
            name="display_name"
            render={({ field }: { field: ControllerRenderProps<SignUpValues, "display_name"> }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    autoCapitalize="words"
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
            render={({ field }: { field: ControllerRenderProps<SignUpValues, "password"> }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
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
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            onClick={() => console.log('Button clicked')}
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create account
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Already have an account?{' '}
        <Link 
          href={{
            pathname: '/signin',
            query: redirectUrl ? { redirect: redirectUrl } : undefined
          }}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
} 