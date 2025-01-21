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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { signUpAction } from '@/app/(org)/org/signup/actions'
import { useToast } from '@/hooks/use-toast'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  organization_name: z.string().min(2, 'Organization name must be at least 2 characters'),
  role: z.enum(['admin', 'employee'], {
    required_error: 'Please select a role',
  }),
  department: z.string().min(2, 'Department must be at least 2 characters'),
})

type SignUpValues = z.infer<typeof signUpSchema>

export function OrgSignUpForm() {
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
      organization_name: '',
      role: 'employee',
      department: '',
    },
  })

  async function onSubmit(data: SignUpValues) {
    setIsLoading(true)
    console.log('Starting organization sign up...')

    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('organization_name', data.organization_name)
      formData.append('role', data.role)
      formData.append('department', data.department)
      
      const result = await signUpAction(formData)
      console.log('Sign up result:', result)

      if (result?.error) {
        console.error('Sign up error:', result.error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Your organization account is pending approval. Please check your email.',
      })

      // Redirect after successful signup
      router.push(redirectUrl ? `/org/signin?redirect=${encodeURIComponent(redirectUrl)}` : '/org/signin')
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: ControllerRenderProps<SignUpValues, "email"> }) => (
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
                <FormDescription>
                  Please use your work email address
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="organization_name"
            render={({ field }: { field: ControllerRenderProps<SignUpValues, "organization_name"> }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Acme Inc."
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
            name="role"
            render={({ field }: { field: ControllerRenderProps<SignUpValues, "role"> }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select 
                  disabled={isLoading} 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="employee">Support Employee</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Administrators can manage team members and settings
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }: { field: ControllerRenderProps<SignUpValues, "department"> }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Support Team"
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
                <FormDescription>
                  Must be at least 8 characters with uppercase, lowercase, and number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Register Organization
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Already have an organization account?{' '}
        <Link 
          href={{
            pathname: '/org/signin',
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