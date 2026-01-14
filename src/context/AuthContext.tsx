import React, { createContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../adapters/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Check active session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })
      .catch((error) => {
        console.error('Error fetching session:', error)
        // Fallback to localStorage session if available
        try {
          const storedSession = localStorage.getItem('supabase.auth.token')
          if (storedSession) {
            const { access_token } = JSON.parse(storedSession)
            if (access_token) {
              // Session exists in storage, will be validated by listener
              console.log('Using localStorage session as fallback')
            }
          }
        } catch (fallbackError) {
          console.error('Error accessing localStorage:', fallbackError)
        }
      })
      .finally(() => {
        setLoading(false)
      })

    // Listen for changes
    let subscription: { unsubscribe: () => void } | undefined
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        try {
          setUser(session?.user ?? null)
        } catch (error) {
          console.error('Error in auth state change handler:', error)
        } finally {
          setLoading(false)
        }
      })
      subscription = data.subscription
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
      setLoading(false)
    }

    return () => subscription?.unsubscribe()
  }, [])

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn: signInWithPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
