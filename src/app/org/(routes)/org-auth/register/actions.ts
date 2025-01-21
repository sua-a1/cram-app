'use server'

import { createServerSupabaseClient } from '@/lib/server/supabase'
import { redirect } from 'next/navigation'

export async function registerAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  
  const name = formData.get('name') as string
  const domain = formData.get('domain') as string

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: userError || new Error('User not found') }
  }

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      domain,
      created_by: user.id
    })
    .select()
    .single()

  if (orgError) {
    return { error: orgError }
  }

  // Update user's profile with organization
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ org_id: org.id })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError }
  }

  redirect(`/org/${org.id}/admin`)
} 