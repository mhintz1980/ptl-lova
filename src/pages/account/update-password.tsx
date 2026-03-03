// src/pages/account/update-password.jsx
// Password update page - handles magic-link session from Supabase
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const navigate = useNavigate()

  // Check for valid session from magic link on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        toast.error('Supabase not configured. Please contact support.')
        setIsValidSession(false)
        return
      }

      try {
        // Get session from URL fragment (magic link)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          setIsValidSession(false)
          return
        }

        if (data?.session) {
          setIsValidSession(true)
        } else {
          // No session - need to listen for auth state change as fallback
          const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
              if (session) {
                setIsValidSession(true)
              } else {
                setIsValidSession(false)
              }
            }
          )

          // Check if we eventually get a session
          setTimeout(() => {
            if (isValidSession === null) {
              setIsValidSession(false)
            }
          }, 3000)

          return () => {
            authListener.subscription.unsubscribe()
          }
        }
      } catch (err) {
        console.error('Unexpected error checking session:', err)
        setIsValidSession(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!supabase) {
      toast.error('Supabase not configured. Please contact support.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error('Failed to update password. Please try again.')
        console.error('Update password error:', error)
      } else {
        toast.success('Password updated successfully!')
        // Sign out and redirect to login
        await supabase.auth.signOut()
        navigate('/login')
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Unexpected error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Update Password</CardTitle>
            <CardDescription>Verifying your session...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid session - show error
  if (isValidSession === false) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
              Please request a new password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild className="w-full">
              <Link to="/reset-password">Request New Link</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid session - show password update form
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Update Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                New Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                required
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={isLoading}
              />
            </div>
            <Button className="w-full" type="submit" loading={isLoading}>
              Update Password
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login" className="hover:underline">
              Cancel
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
