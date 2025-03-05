import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON backup file from the request
    const backup = await request.json()

    // Validate backup format
    if (!backup.metadata || !backup.data) {
      return NextResponse.json({ success: false, error: "Invalid backup format" }, { status: 400 })
    }

    // Create a Supabase client with admin privileges
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

    // Process each table in the backup
    const results: Record<string, { success: boolean; message?: string; error?: string }> = {}

    for (const table of Object.keys(backup.data)) {
      try {
        const tableData = backup.data[table]

        if (!tableData || tableData.length === 0) {
          results[table] = { success: true, message: "No data to restore" }
          continue
        }

        // First check if the table exists
        const { data: checkData, error: checkError } = await supabaseAdmin.from(table).select("id").limit(1)

        if (checkError && checkError.code === "42P01") {
          // Table doesn't exist
          results[table] = {
            success: false,
            error: `Table "${table}" doesn't exist in the database. Create the table structure first.`,
          }
          continue
        }

        // First, delete existing data
        const { error: deleteError } = await supabaseAdmin.from(table).delete().neq("id", "placeholder")

        if (deleteError) {
          results[table] = { success: false, error: `Error clearing table: ${deleteError.message}` }
          continue
        }

        // Then insert the backup data
        const { error: insertError } = await supabaseAdmin.from(table).insert(tableData)

        if (insertError) {
          results[table] = { success: false, error: `Error restoring data: ${insertError.message}` }
        } else {
          results[table] = { success: true, message: `Restored ${tableData.length} records` }
        }
      } catch (error: any) {
        results[table] = { success: false, error: `Unexpected error: ${error.message}` }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Restore completed with some results",
      results,
    })
  } catch (error: any) {
    console.error("Error restoring backup:", error)
    return NextResponse.json({ success: false, error: `Failed to restore backup: ${error.message}` }, { status: 500 })
  }
}

