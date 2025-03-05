"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

export function LogoutTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDirectLogout = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      
      console.log("Attempting direct Supabase logout...")
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Supabase signOut error:", error)
        setError(error.message)
        return
      }
      
      console.log("Supabase logout successful")
      setSuccess(true)
      
      // Force redirect after a short delay
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    } catch (err) {
      console.error("Error during logout:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg z-50">
      <h3 className="font-bold mb-2">Logout Test</h3>
      
      <Button 
        onClick={handleDirectLogout}
        disabled={loading}
        className="w-full mb-2"
      >
        {loading ? "Logging out..." : "Direct Supabase Logout"}
      </Button>
      
      <Button 
        onClick={() => window.location.href = '/login'}
        variant="outline"
        className="w-full"
      >
        Force Redirect to Login
      </Button>
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-sm">
          Error: {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-sm">
          Logout successful! Redirecting...
        </div>
      )}
    </div>
  )
}