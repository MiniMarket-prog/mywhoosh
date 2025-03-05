import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Create a Supabase client with admin privileges for database operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // List of tables to back up
    const tables = [
      "settings",
      "products",
      "users",
      "customers",
      "sales",
      "sale_items",
      "expenses",
      "financial_goals",
      "commission_rules",
    ]

    // Object to store all data
    const backupData: Record<string, any[]> = {}

    // Fetch data from each table
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin.from(table).select("*")

        if (error) {
          console.warn(`Error fetching data from ${table}:`, error)
          backupData[table] = []
        } else {
          backupData[table] = data || []
        }
      } catch (error) {
        console.warn(`Error fetching data from ${table}:`, error)
        backupData[table] = []
      }
    }

    // Add metadata
    const backup = {
      metadata: {
        version: "1.0",
        timestamp: new Date().toISOString(),
        tables: tables,
      },
      data: backupData,
    }

    // Return the backup data as a downloadable JSON file
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="mini-market-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error creating backup:", error)
    return NextResponse.json({ success: false, error: "Failed to create backup" }, { status: 500 })
  }
}

