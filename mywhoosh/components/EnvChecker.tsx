"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export function EnvChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean
    supabaseKey: boolean
    serviceRoleKey: boolean
  } | null>(null)

  const checkEnvironmentVariables = () => {
    setIsChecking(true)

    // Check if environment variables are defined in the browser
    // Note: Only NEXT_PUBLIC_ variables are available in the browser
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Service role key is not available in the browser, so we'll just check if it's defined on the server
    // by making a request to a simple API endpoint
    fetch("/api/check-env")
      .then((res) => res.json())
      .then((data) => {
        setEnvStatus({
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          serviceRoleKey: data.serviceRoleKey,
        })
      })
      .catch((error) => {
        console.error("Error checking environment variables:", error)
        setEnvStatus({
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          serviceRoleKey: false,
        })
      })
      .finally(() => {
        setIsChecking(false)
      })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Check if your Supabase environment variables are properly configured.
        </p>

        {envStatus && (
          <div className="space-y-2">
            <div className="flex items-center">
              {envStatus.supabaseUrl ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span>NEXT_PUBLIC_SUPABASE_URL: {envStatus.supabaseUrl ? "Defined" : "Missing"}</span>
            </div>

            <div className="flex items-center">
              {envStatus.supabaseKey ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envStatus.supabaseKey ? "Defined" : "Missing"}</span>
            </div>

            <div className="flex items-center">
              {envStatus.serviceRoleKey ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span>SUPABASE_SERVICE_ROLE_KEY: {envStatus.serviceRoleKey ? "Defined" : "Missing"}</span>
            </div>

            {(!envStatus.supabaseUrl || !envStatus.supabaseKey || !envStatus.serviceRoleKey) && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing Environment Variables</AlertTitle>
                <AlertDescription>
                  Some required environment variables are missing. Please check your .env.local file or Vercel
                  environment variables.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Button onClick={checkEnvironmentVariables} disabled={isChecking}>
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Environment Variables"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

