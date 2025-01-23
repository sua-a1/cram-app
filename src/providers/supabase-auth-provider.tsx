'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { AuthUser } from '@/types/auth'

type AuthContextType = {
  user: AuthUser | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check user's profile to determine where to redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, org_id')
          .eq('user_id', session.user.id)
          .single()

        if (profile) {
          const redirectPath = profile.role === 'customer'
            ? '/customer'
            : profile.org_id
              ? '/org/dashboard'
              : '/org/org-auth/access'

          window.location.href = redirectPath
        } else {
          router.refresh()
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/org/org-auth/signin')
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    
    // Clear local storage and session storage
    window.localStorage.clear()
    window.sessionStorage.clear()
    
    // Hard redirect to sign in page
    window.location.href = '/org/org-auth/signin'
  }

  const value = {
    user,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 