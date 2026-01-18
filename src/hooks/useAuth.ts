import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.shared'

export function useAuth() {
  return useContext(AuthContext)
}
