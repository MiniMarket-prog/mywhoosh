"use client"

import { useAuth } from "@/contexts/auth-context"

export default function TestAuthPage() {
  const { profile } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Auth Test Page</h1>
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Current User Profile:</h2>
        <pre className="bg-gray-100 p-4 rounded-md overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
      </div>
    </div>
  )
}

