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
    // Mock implementation
    console.log("Sign in with", email, password)
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

