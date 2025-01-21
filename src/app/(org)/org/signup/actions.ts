'use server'

import { createClient, createAdminClient } from '@/lib/server/auth-logic'
import { Database } from '@/lib/database.types'
import { redirect } from 'next/navigation'

type Organization = Database['public']['Tables']['organizations']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export async function signUpAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // First create the organization
    const { data: organization, error: orgError } = await adminClient
      .from('organizations')
      .insert<Database['public']['Tables']['organizations']['Insert']>([
        {
          name: formData.get('organization_name') as string,
          domain: null, // Can be updated later
          status: 'active',
        },
      ])
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      throw orgError
    }

    // Then sign up the user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      options: {
        data: {
          role: formData.get('role'),
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/org/callback`,
      },
    })

    if (signUpError) {
      // Rollback organization creation
      await adminClient
        .from('organizations')
        .delete()
        .eq('id', organization.id)
      throw signUpError
    }

    // Create profile using admin client
    if (user) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: (formData.get('email') as string).split('@')[0],
          role: formData.get('role') as string,
          org_id: organization.id,
          department: formData.get('department') as string,
        })

      if (profileError) {
        // Rollback organization creation and user
        await adminClient
          .from('organizations')
          .delete()
          .eq('id', organization.id)
        await adminClient.auth.admin.deleteUser(user.id)
        throw profileError
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in organization signUp:', error)
    return { error: error.message }
  }
} 