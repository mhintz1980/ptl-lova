import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider as AuthProviderComponent } from './AuthContext'
import { useAuth as useAuthHook } from '../hooks/useAuth'

// Mock Supabase client
vi.mock('../adapters/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

function TestComponent() {
  const { loading, user } = useAuthHook()
  if (loading) return <div>Loading...</div>
  return <div>{user ? 'Logged In' : 'Logged Out'}</div>
}

describe('AuthContext', () => {
  it('renders children and provides auth state', async () => {
    render(
      <AuthProviderComponent>
        <TestComponent />
      </AuthProviderComponent>
    )

    // Initially loading
    expect(screen.getByText('Loading...')).toBeTruthy()

    // Eventually resolves (mock returns null session)
    await waitFor(() => {
      expect(screen.getByText('Logged Out')).toBeTruthy()
    })
  })
})
