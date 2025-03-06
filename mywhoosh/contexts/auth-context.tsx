"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface UserProfile {
  id: string
  email: string
  role: "admin" | "cashier"
  name: string
}

interface AuthContextType {
  user: any | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  // For development purposes, create a mock admin profile
  useEffect(() => {
    // This is just for development - remove in production
    setProfile({
      id: "mock-user-id",
      email: "admin@example.com",
      role: "admin",
      name: "Admin User",
    })
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Mock implementation or actual implementation
      console.log("Sign in with", email, password)

      // If using Supabase, you might do something like:
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password
      // })

      // if (error) {
      //   throw error
      // }

      // Set user state if login successful
      // setUser(data.user)

      // Fetch profile after successful login
      // const { data: profileData } = await supabase
      //   .from('profiles')
      //   .select('*')
      //   .eq('id', data.user.id)
      //   .single()

      // setProfile(profileData)
    } catch (error) {
      console.error("Sign in error:", error)
      throw error // Re-throw the error to be caught by the login page
    }
  }

  const signOut = async () => {
    // Mock implementation
    console.log("Sign out")
  }

  return <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

