import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient, createServiceClient, generatePKCE } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import type { CookieStore } from '@/types/cookies'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import type { 
  AuthUser, 
  UserRole, 
  SignUpCredentials, 
  SignInCredentials, 
  AuthResponse,
  PKCECodePair,
  AuthOptions,
  AuthSession
} from '@/types/auth'
import type { User, Session } from '@supabase/supabase-js'

// Cookie configuration
const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7 // 1 week
}

// Transform Supabase User to AuthUser
async function transformUser(user: User | null, supabase: any): Promise<AuthUser | null> {
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role, org_id')
    .eq('user_id', user.id)
    .single()

  return {
    ...user,
    role: (profile?.role || 'customer') as UserRole,
    org_id: profile?.org_id,
    display_name: profile?.display_name || user.email!.split('@')[0],
  } as AuthUser
}

// Transform Supabase Session to AuthSession
async function transformSession(session: Session | null, supabase: any): Promise<AuthSession | null> {
  if (!session) return null
  const user = await transformUser(session.user, supabase)
  if (!user) return null
  
  return {
    ...session,
    user
  } as AuthSession
}

// Store PKCE code verifier in cookie
function storeCodeVerifier(codeVerifier: string): void {
  const cookieStore = cookies() as unknown as CookieStore
  const cookie = {
    name: 'code_verifier',
    value: codeVerifier,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
  }
  cookieStore.set(cookie)
}

// Get stored code verifier from cookie
function getCodeVerifier(): string | undefined {
  const cookieStore = cookies() as unknown as CookieStore
  return cookieStore.get('code_verifier')?.value
}

// Clear code verifier cookie
function clearCodeVerifier(): void {
  const cookieStore = cookies() as unknown as CookieStore
  cookieStore.delete('code_verifier')
}

// Initialize PKCE flow
export async function initializePKCE(): Promise<PKCECodePair> {
  const { codeVerifier, codeChallenge } = await generatePKCE()
  storeCodeVerifier(codeVerifier)
  return { codeVerifier, codeChallenge }
}

// Sign in with PKCE
export async function signInWithPKCE(credentials: SignInCredentials): Promise<AuthResponse> {
  const supabase = await createServerClient()
  const { codeChallenge } = await generatePKCE()

  const { data, error } = await supabase.auth.signInWithPassword({
    ...credentials,
    options: {
      codeChallenge,
      codeChallengeMethod: 'S256'
    } as AuthOptions
  })

  if (error) {
    return { user: null, session: null, error }
  }

  const session = await transformSession(data.session, supabase)
  return { user: session?.user || null, session }
}

// Sign up with PKCE
export async function signUpWithPKCE(credentials: SignUpCredentials): Promise<AuthResponse> {
  const supabase = await createServerClient()
  const { codeChallenge } = await generatePKCE()

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: { role: credentials.role || 'customer', display_name: credentials.display_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  })

  if (error) {
    return { user: null, session: null, error }
  }

  const session = await transformSession(data.session, supabase)
  return { user: session?.user || null, session }
}

// Sign out
export async function signOut(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}

// Get current session
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return transformSession(session, supabase)
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession()
  return session?.user || null
}

// Require authentication
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    redirect('/auth/signin')
  }
  return session
}

export class AuthService {
  static async requireAuth(): Promise<AuthSession> {
    const session = await getSession()
    if (!session) {
      redirect('/auth/signin')
    }
    return session
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const session = await getSession()
    return session?.user || null
  }

  // Customer Auth Flow
  static async signUpCustomer({ email, password, display_name }: SignUpCredentials): Promise<AuthResponse> {
    const supabase = await createServerClient()
    const adminClient = await createServiceClient()
    const { codeVerifier, codeChallenge } = await generatePKCE()
    
    try {
      // Store code verifier in a secure cookie
      cookies().set('code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10 // 10 minutes
      })

      // Sign up with PKCE
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: 'customer', display_name },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      })

      if (error) throw error
      if (!user) throw new Error('No user returned from auth signup')

      // Create profile using admin client
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: display_name || email.split('@')[0],
          role: 'customer',
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      return { 
        user: await transformUser(user, supabase),
        session: null // Session will be established after email verification
      }
    } catch (error: any) {
      console.error('Customer signup error:', error)
      return { user: null, session: null, error: error.message }
    }
  }

  // Organization Auth Flow
  static async signUpOrgUser({ email, password, display_name, org_id, role }: SignUpCredentials & { org_id: string }): Promise<AuthResponse> {
    const supabase = await createServerClient()
    const adminClient = await createServiceClient()
    const { codeVerifier, codeChallenge } = await generatePKCE()
    
    try {
      // Store code verifier in a secure cookie
      cookies().set('code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10 // 10 minutes
      })

      // Sign up with PKCE
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, display_name, org_id },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      })

      if (error) throw error
      if (!user) throw new Error('No user returned from auth signup')

      // Create profile using admin client
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: display_name || email.split('@')[0],
          role,
          org_id,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      return { 
        user: await transformUser(user, supabase),
        session: null // Session will be established after email verification
      }
    } catch (error: any) {
      console.error('Organization user signup error:', error)
      return { user: null, session: null, error: error.message }
    }
  }

  // Shared Sign In (works for both flows)
  static async signIn({ email, password }: SignInCredentials): Promise<AuthResponse> {
    const supabase = await createServerClient()
    const { codeVerifier, codeChallenge } = await generatePKCE()
    
    try {
      // Store code verifier in a secure cookie
      cookies().set('code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10 // 10 minutes
      })

      // Sign in with PKCE
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      if (!user || !session) throw new Error('No user or session after sign in')

      const transformedUser = await transformUser(user, supabase)
      const transformedSession = await transformSession(session, supabase)

      // Redirect based on role
      if (transformedUser?.role === 'customer') {
        redirect('/customer/dashboard')
      } else if (transformedUser?.org_id) {
        redirect(`/org/${transformedUser.org_id}/dashboard`)
      } else {
        redirect('/org/access')
      }

      return { user: transformedUser, session: transformedSession }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { user: null, session: null, error: error.message }
    }
  }

  // Require Role
  static async requireRole(allowedRoles: UserRole[]) {
    const session = await AuthService.requireAuth()
    const user = await AuthService.getCurrentUser()
    
    if (!user?.role || !allowedRoles.includes(user.role)) {
      redirect('/unauthorized')
    }
    
    return { session, user }
  }
} 