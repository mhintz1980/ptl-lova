import { createContext } from 'react'
import { AuthContextType } from './AuthContext.types'

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
})
