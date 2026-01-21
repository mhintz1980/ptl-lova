import React, { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../adapters/supabase'
import { AuthContext } from './AuthContext.shared'
import { logErrorReport } from '../lib/error-reporting'

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
        logErrorReport(error, {
          where: 'AuthProvider.getSession',
          what: 'Failed to fetch auth session',
          request: {
            route: 'AppInit',
            operation: 'get session',
          },
        })
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
          logErrorReport(error, {
            where: 'AuthProvider.onAuthStateChange',
            what: 'Failed to apply auth state update',
            request: {
              route: 'AuthListener',
              operation: 'update auth state',
            },
          })
        } finally {
          setLoading(false)
        }
      })
      subscription = data.subscription
    } catch (error) {
      logErrorReport(error, {
        where: 'AuthProvider.onAuthStateChange',
        what: 'Failed to register auth state listener',
        request: {
          route: 'AppInit',
          operation: 'register auth listener',
        },
      })
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
