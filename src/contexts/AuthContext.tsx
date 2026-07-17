import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import type { User } from '../types'

type AuthContextType = {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, username: string, isStreamer: boolean) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Fetch user profile
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (data) setUser(data)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (data) setUser(data)
      } else {
        setUser(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string, isStreamer: boolean) => {
    const { data: { user: newUser }, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!newUser) throw new Error('Signup failed')

    // Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: newUser.id,
      email,
      username,
      is_streamer: isStreamer,
    })

    if (profileError) throw profileError
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
