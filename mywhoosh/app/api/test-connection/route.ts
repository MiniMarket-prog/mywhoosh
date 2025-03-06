import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Check if credentials are available
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Missing Supabase credentials")
      return NextResponse.json({
        success: false,
        error: "Missing Supabase credentials. Please check your environment variables.",
      })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection by making a simple query
    const { data, error } = await supabase.from("settings").select("id").limit(1)

    // If there's an error with the query but it's because the table doesn't exist,
    // that's still a successful connection to Supabase itself
    if (error && error.code === "42P01") {
      // PostgreSQL code for "relation does not exist"
      return NextResponse.json({
        success: true,
        message: "Connected to Supabase, but the settings table doesn't exist yet.",
      })
    }

    if (error) {
      console.error("Error testing Supabase connection:", error)
      return NextResponse.json({
        success: false,
        error: `Failed to connect to Supabase: ${error.message}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase.",
    })
  } catch (error: any) {
    console.error("Error in test-connection API route:", error)
    return NextResponse.json({
      success: false,
      error: `Connection test failed: ${error.message}`,
    })
  }
}

