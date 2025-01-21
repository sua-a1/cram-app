'use server'

import { createClient } from '@/lib/server/auth-logic'

export async function registerOrganization(formData: FormData) {
  try {
    const orgName = formData.get('orgName') as string
    const domain = formData.get('domain') as string
    const adminEmail = formData.get('adminEmail') as string
    const adminName = formData.get('adminName') as string
    const password = formData.get('password') as string

    // Validate required fields
    if (!orgName || !adminEmail || !adminName || !password) {
      return { error: 'All required fields must be provided' }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Start a transaction
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert([
        {
          name: orgName,
          domain: domain || null,
          status: 'active',
        },
      ])
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return { error: 'Failed to create organization' }
    }

    // Sign up the admin user
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password,
      options: {
        data: {
          display_name: adminName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (authError) {
      // Rollback organization creation
      await supabase
        .from('organizations')
        .delete()
        .match({ id: organization.id })
      
      console.error('Error creating admin user:', authError)
      return { error: 'Failed to create admin account' }
    }

    // Create admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: auth.user!.id,
          display_name: adminName,
          role: 'admin',
          org_id: organization.id,
        },
      ])

    if (profileError) {
      // Rollback organization creation and user
      await supabase
        .from('organizations')
        .delete()
        .match({ id: organization.id })
      
      console.error('Error creating admin profile:', profileError)
      return { error: 'Failed to create admin profile' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in registerOrganization:', error)
    return { error: 'An unexpected error occurred' }
  }
} 