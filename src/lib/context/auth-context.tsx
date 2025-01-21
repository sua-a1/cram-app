'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/actions/profile'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Create a service role client to bypass RLS
  const serviceClient = createClientComponentClient({
    options: {
      auth: {
        persistSession: false
      }
    }
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      // If we have a user, fetch their profile
      if (session?.user) {
        getProfile(session.user.id).then(({ profile }) => {
          if (profile) {
            // Store profile data in localStorage for persistence
            localStorage.setItem('userProfile', JSON.stringify(profile))
          }
        })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_OUT') {
        // Clear any application storage
        localStorage.clear()
        sessionStorage.clear()
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user profile on sign in
        const { profile } = await getProfile(session.user.id)
        if (profile) {
          localStorage.setItem('userProfile', JSON.stringify(profile))
        }
      }
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    isLoading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 