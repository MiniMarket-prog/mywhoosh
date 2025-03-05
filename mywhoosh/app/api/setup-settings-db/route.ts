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

    // Create settings table
    try {
      const { data, error } = await supabaseAdmin.from("settings").select("id").limit(1)

      if (error) {
        // Table doesn't exist, create it
        console.log("Creating settings table")

        // Use Supabase SQL function if available
        try {
          // Try to create the table using SQL
          const { error: sqlError } = await supabaseAdmin.rpc("exec_sql", {
            sql: `
              CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY,
                value JSONB NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                updated_by UUID REFERENCES auth.users(id)
              );
              
              -- Create initial settings records
              INSERT INTO settings (id, value) VALUES 
              ('general', '{"storeName":"Mini Market","address":"123 Market Street, City, Country","phone":"+1 234 567 8900","email":"contact@minimarket.com","currency":"MAD"}'),
              ('receipt', '{"headerText":"Thank you for shopping at Mini Market!","footerText":"Please come again!","showLogo":true,"printReceipt":true,"emailReceipt":false}'),
              ('tax', '{"enableTax":true,"taxRate":7.5,"taxName":"Sales Tax","taxIncluded":false}'),
              ('preferences', '{"theme":"light","language":"en","dateFormat":"MM/DD/YYYY","timeFormat":"12h"}')
              ON CONFLICT (id) DO NOTHING;
              
              -- Create an index for faster lookups
              CREATE INDEX IF NOT EXISTS settings_id_idx ON settings (id);
            `,
          })

          if (sqlError) {
            console.error("Error creating settings table via SQL:", sqlError)
            throw sqlError
          }
        } catch (rpcError) {
          console.error("Error creating settings table:", rpcError)
          throw rpcError
        }
      } else {
        console.log("Settings table already exists")
      }
    } catch (error) {
      console.error("Error checking/creating settings table:", error)

      // If we can't create the table programmatically, provide SQL for manual execution
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create settings table automatically",
          sql: `
          CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            updated_by UUID REFERENCES auth.users(id)
          );
          
          -- Create initial settings records
          INSERT INTO settings (id, value) VALUES 
          ('general', '{"storeName":"Mini Market","address":"123 Market Street, City, Country","phone":"+1 234 567 8900","email":"contact@minimarket.com","currency":"MAD"}'),
          ('receipt', '{"headerText":"Thank you for shopping at Mini Market!","footerText":"Please come again!","showLogo":true,"printReceipt":true,"emailReceipt":false}'),
          ('tax', '{"enableTax":true,"taxRate":7.5,"taxName":"Sales Tax","taxIncluded":false}'),
          ('preferences', '{"theme":"light","language":"en","dateFormat":"MM/DD/YYYY","timeFormat":"12h"}')
          ON CONFLICT (id) DO NOTHING;
          
          -- Create an index for faster lookups
          CREATE INDEX IF NOT EXISTS settings_id_idx ON settings (id);
        `,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Settings table created successfully" })
  } catch (error) {
    console.error("Error setting up settings table:", error)
    return NextResponse.json({ success: false, error: "Failed to set up settings table" }, { status: 500 })
  }
}

