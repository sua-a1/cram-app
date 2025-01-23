import type { CookieOptions, CookieMethodsServer } from '@supabase/ssr'

// Re-export Supabase's cookie types
export type { CookieOptions, CookieMethodsServer }

// Type for Next.js cookie store
export interface CookieStore {
  get(name: string): { value: string } | undefined
  set(options: { name: string; value: string } & CookieOptions): void
  delete(name: string): void
}

// Cookie methods for Supabase client
export interface CookieMethods extends CookieMethodsServer {
  get(name: string): string | undefined
  set(name: string, value: string, options?: CookieOptions): void
  remove(name: string, options?: CookieOptions): void
}

export interface CookieAdapter {
  get(name: string): Promise<string | undefined>
  set(name: string, value: string, options: CookieOptions): Promise<void>
  remove(name: string, options: CookieOptions): Promise<void>
}

export interface CookieConfig {
  name: string
  value: string
  options?: CookieOptions
}

export type CookieHandler = {
  get: (name: string) => Promise<string | undefined>
  set: (name: string, value: string, options: CookieOptions) => Promise<void>
  remove: (name: string, options: CookieOptions) => Promise<void>
} 