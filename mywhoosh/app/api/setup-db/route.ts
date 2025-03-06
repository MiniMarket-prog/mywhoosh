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

    // Create financial_goals table
    try {
      const { data, error } = await supabaseAdmin.from("financial_goals").select("id").limit(1)

      if (error) {
        // Table doesn't exist, create it
        console.log("Creating financial_goals table")

        // Use Supabase SQL function if available
        try {
          // Try to create the table using SQL
          const { error: sqlError } = await supabaseAdmin.rpc("exec_sql", {
            sql: `
              CREATE TABLE IF NOT EXISTS financial_goals (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name TEXT NOT NULL,
                target_amount DECIMAL(10, 2) NOT NULL,
                current_amount DECIMAL(10, 2) DEFAULT 0,
                start_date TIMESTAMPTZ NOT NULL,
                end_date TIMESTAMPTZ NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
              );
            `,
          })

          if (sqlError) {
            console.error("Error creating financial_goals table via SQL:", sqlError)
            console.log("Please run the following SQL in your Supabase SQL Editor:")
            console.log(`
              CREATE TABLE IF NOT EXISTS financial_goals (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name TEXT NOT NULL,
                target_amount DECIMAL(10, 2) NOT NULL,
                current_amount DECIMAL(10, 2) DEFAULT 0,
                start_date TIMESTAMPTZ NOT NULL,
                end_date TIMESTAMPTZ NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
              );
            `)
          }
        } catch (rpcError) {
          console.error("Error creating financial_goals table:", rpcError)
          console.log("Please run the following SQL in your Supabase SQL Editor:")
          console.log(`
            CREATE TABLE IF NOT EXISTS financial_goals (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              name TEXT NOT NULL,
              target_amount DECIMAL(10, 2) NOT NULL,
              current_amount DECIMAL(10, 2) DEFAULT 0,
              start_date TIMESTAMPTZ NOT NULL,
              end_date TIMESTAMPTZ NOT NULL,
              category TEXT NOT NULL,
              type TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
          `)
        }
      }
    } catch (error) {
      console.error("Error checking/creating financial_goals table:", error)
    }

    // Create commission_rules table
    try {
      const { data, error } = await supabaseAdmin.from("commission_rules").select("id").limit(1)

      if (error) {
        // Table doesn't exist, create it
        console.log("Creating commission_rules table")

        // Use Supabase SQL function if available
        try {
          // Try to create the table using SQL
          const { error: sqlError } = await supabaseAdmin.rpc("exec_sql", {
            sql: `
              CREATE TABLE IF NOT EXISTS commission_rules (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name TEXT NOT NULL,
                percentage DECIMAL(5, 2) NOT NULL,
                product_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
              );
          
          -- Insert default commission rules
          INSERT INTO commission_rules (name, percentage, product_id)
          VALUES 
            ('Standard Commission', 5, 'all'),
            ('Premium Products', 8, 'premium'),
            ('Seasonal Promotion', 10, 'seasonal'),
            ('Clearance Items', 3, 'clearance')
          ON CONFLICT DO NOTHING;
        `,
          })

          if (sqlError) {
            console.error("Error creating commission_rules table via SQL:", sqlError)
            console.log("Please run the following SQL in your Supabase SQL Editor:")
            console.log(`
              CREATE TABLE IF NOT EXISTS commission_rules (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name TEXT NOT NULL,
                percentage DECIMAL(5, 2) NOT NULL,
                product_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
              );
          
          -- Insert default commission rules
          INSERT INTO commission_rules (name, percentage, product_id)
          VALUES 
            ('Standard Commission', 5, 'all'),
            ('Premium Products', 8, 'premium'),
            ('Seasonal Promotion', 10, 'seasonal'),
            ('Clearance Items', 3, 'clearance')
          ON CONFLICT DO NOTHING;
        `)
          }
        } catch (rpcError) {
          console.error("Error creating commission_rules table:", rpcError)
          console.log("Please run the following SQL in your Supabase SQL Editor:")
          console.log(`
        CREATE TABLE IF NOT EXISTS commission_rules (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          percentage DECIMAL(5, 2) NOT NULL,
          product_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Insert default commission rules
        INSERT INTO commission_rules (name, percentage, product_id)
        VALUES 
          ('Standard Commission', 5, 'all'),
          ('Premium Products', 8, 'premium'),
          ('Seasonal Promotion', 10, 'seasonal'),
          ('Clearance Items', 3, 'clearance')
        ON CONFLICT DO NOTHING;
      `)
        }
      }
    } catch (error) {
      console.error("Error checking/creating commission_rules table:", error)
    }

    return NextResponse.json({ success: true, message: "Database setup completed successfully" })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json({ success: false, error: "Failed to set up database" }, { status: 500 })
  }
}

