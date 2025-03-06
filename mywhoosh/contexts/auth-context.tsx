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
  const [loading, setLoading] = useState(true)

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
      setLoading(true)
      // Mock implementation
      console.log("Sign in with", email, password)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Set mock user data
      setUser({ id: "mock-user-id", email })
      setProfile({
        id: "mock-user-id",
        email: email,
        role: "admin",
        name: "Admin User",
      })
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      console.log("Signing out...")

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Clear user data
      setUser(null)
      setProfile(null)

      // Optional: Redirect to login page
      // If using Next.js App Router
      window.location.href = "/login"

      console.log("Sign out successful")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    } finally {
      setLoading(false)
    }
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

