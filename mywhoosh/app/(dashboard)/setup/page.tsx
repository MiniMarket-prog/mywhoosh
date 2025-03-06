"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, Loader2 } from "lucide-react"
import { ConfirmationDialog } from "@/components/ConfirmationDialog"

// Import the language context
import { useLanguage } from "@/contexts/language-context"

// Add authentication check
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

// Import the EnvChecker component
import { EnvChecker } from "@/components/EnvChecker"

// Add more setup options
export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "success" | "error">("untested")
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    error?: string
    sql?: string
  } | null>(null)
  const { t, dir } = useLanguage()
  const { profile } = useAuth()
  const router = useRouter()
  const [setupType, setSetupType] = useState<"settings" | "all" | "products" | "users">("settings")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [setupProgress, setSetupProgress] = useState<{
    current: number
    total: number
    step: string
  } | null>(null)

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== "admin") {
      router.push("/dashboard")
    }
  }, [profile, router])

  // If profile is still loading or user is not admin, show loading or unauthorized message
  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (profile.role !== "admin") {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>You don't have permission to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                This page is only accessible to administrators. Please contact your system administrator if you need
                access.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const handleSetupSettings = async () => {
    try {
      setIsLoading(true)
      setResult(null)

      // Initialize progress
      setSetupProgress({
        current: 0,
        total: 3, // Total number of steps
        step: "Initializing setup...",
      })

      // Step 1: Check database connection
      setSetupProgress({
        current: 1,
        total: 3,
        step: "Checking database connection...",
      })

      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate delay

      // Step 2: Create tables
      setSetupProgress({
        current: 2,
        total: 3,
        step: "Creating database tables...",
      })

      // Use different endpoints based on setup type
      const endpoint =
        setupType === "settings"
          ? "/api/setup-settings"
          : setupType === "all"
            ? "/api/setup-all"
            : `/api/setup-${setupType}`

      const response = await fetch(endpoint)
      const data = await response.json()

      // Step 3: Initialize default data
      setSetupProgress({
        current: 3,
        total: 3,
        step: "Initializing default settings...",
      })

      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate delay

      setResult(data)
      setSetupProgress(null)
    } catch (error) {
      setResult({
        success: false,
        error: "An unexpected error occurred during setup",
      })
      setSetupProgress(null)
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      setIsTestingConnection(true)
      setConnectionStatus("untested")
      setResult(null) // Clear any previous results

      const response = await fetch("/api/test-connection")
      const data = await response.json()

      if (data.success) {
        setConnectionStatus("success")
        setResult({
          success: true,
          message: data.message || "Successfully connected to Supabase.",
        })
      } else {
        setConnectionStatus("error")
        setResult({
          success: false,
          error: data.error || "Failed to connect to Supabase. Check your environment variables.",
        })
      }
    } catch (error: any) {
      setConnectionStatus("error")
      setResult({
        success: false,
        error: `Connection test failed: ${error.message}`,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  return (
    <div className="container mx-auto py-10" dir={dir}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>Initialize your database with required tables and default settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add detailed documentation */}
          <div className="rounded-md border p-4 bg-muted/50">
            <div className="flex flex-col space-y-2">
              <h3 className="font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                About Database Setup
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  This utility helps you initialize your Supabase database with the necessary tables and default data
                  for the Mini Market application.
                </p>
                <p>
                  <strong>What this does:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Creates the <code>settings</code> table if it doesn't exist
                  </li>
                  <li>Initializes default application settings (store name, currency, etc.)</li>
                  <li>Sets up proper indexes for optimal performance</li>
                </ul>
                <p className="text-amber-600 dark:text-amber-400">
                  <strong>Warning:</strong> If the tables already exist, this will reset them to default values. Any
                  customized settings will be lost.
                </p>
              </div>
            </div>
          </div>

          {/* Connection test section */}
          <div className="rounded-md border p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Database Connection</h3>
                <p className="text-sm text-muted-foreground">Test your connection to the Supabase database</p>
              </div>
              <div className="flex items-center gap-2">
                {connectionStatus === "success" && (
                  <span className="text-sm text-green-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" /> Connected
                  </span>
                )}
                {connectionStatus === "error" && (
                  <span className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> Connection failed
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={testConnection} disabled={isTestingConnection}>
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <EnvChecker />

          <div className="grid grid-cols-2 gap-4">
            <div
              className={`rounded-md border p-4 cursor-pointer ${setupType === "settings" ? "border-primary bg-primary/10" : ""}`}
              onClick={() => setSetupType("settings")}
            >
              <div className="flex flex-col space-y-2">
                <h3 className="font-medium">Settings Table</h3>
                <p className="text-sm text-muted-foreground">
                  Create the settings table and initialize it with default values
                </p>
              </div>
            </div>

            <div
              className={`rounded-md border p-4 cursor-pointer ${setupType === "products" ? "border-primary bg-primary/10" : ""}`}
              onClick={() => setSetupType("products")}
            >
              <div className="flex flex-col space-y-2">
                <h3 className="font-medium">Products Table</h3>
                <p className="text-sm text-muted-foreground">Create the products table with sample inventory items</p>
              </div>
            </div>

            <div
              className={`rounded-md border p-4 cursor-pointer ${setupType === "users" ? "border-primary bg-primary/10" : ""}`}
              onClick={() => setSetupType("users")}
            >
              <div className="flex flex-col space-y-2">
                <h3 className="font-medium">Users Table</h3>
                <p className="text-sm text-muted-foreground">Create the users table with a default admin account</p>
              </div>
            </div>

            <div
              className={`rounded-md border p-4 cursor-pointer ${setupType === "all" ? "border-primary bg-primary/10" : ""}`}
              onClick={() => setSetupType("all")}
            >
              <div className="flex flex-col space-y-2">
                <h3 className="font-medium">Complete Setup</h3>
                <p className="text-sm text-muted-foreground">Initialize all tables with default values</p>
              </div>
            </div>
          </div>

          {/* Add progress indicator */}
          {setupProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{setupProgress.step}</span>
                <span>
                  {setupProgress.current} of {setupProgress.total}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${(setupProgress.current / setupProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.message || result.error}

                {!result.success && result.sql && (
                  <div className="mt-2">
                    <p className="font-semibold">Please run this SQL in your Supabase SQL Editor:</p>
                    <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto text-xs">{result.sql}</pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isLoading || connectionStatus === "error"}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                {setupType === "settings"
                  ? "Setup Settings Table"
                  : setupType === "all"
                    ? "Run Complete Setup"
                    : `Setup ${setupType.charAt(0).toUpperCase() + setupType.slice(1)} Table`}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleSetupSettings}
        title="Are you sure?"
        description={`This action will initialize or reset your database tables. Any existing data in these tables will be overwritten. ${
          setupType === "all" ? "Warning: Complete setup will reset ALL tables in your database!" : ""
        }`}
        variant={setupType === "all" ? "destructive" : "default"}
      />
    </div>
  )
}

