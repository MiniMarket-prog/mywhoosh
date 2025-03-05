import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
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

    const tablesCheckResults: Record<string, { exists: boolean; error?: string }> = {}

    // Check essential tables
    const tables = ["products", "sales", "sale_items", "customers", "profiles", "settings"]

    for (const table of tables) {
      try {
        // Use underscore prefix to indicate intentionally unused variable
        const { data: _data, error } = await supabaseAdmin.from(table).select("count").limit(1)

        tablesCheckResults[table] = {
          exists: !error,
        }

        if (error) {
          tablesCheckResults[table].error = error.message
        }
      } catch (err) {
        tablesCheckResults[table] = {
          exists: false,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    }

    // Check for missing tables
    const missingTables = Object.keys(tablesCheckResults).filter((table) => !tablesCheckResults[table].exists)

    if (missingTables.length > 0) {
      // Log the SQL needed to create them
      let sqlNeeded = "-- The following tables need to be created:\n\n"

      // Sales table
      if (missingTables.includes("sales")) {
        sqlNeeded += `
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id UUID REFERENCES profiles(id),
  customer_id UUID REFERENCES customers(id),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`
      }

      // Sale items table
      if (missingTables.includes("sale_items")) {
        sqlNeeded += `
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`
      }

      // Products table
      if (missingTables.includes("products")) {
        sqlNeeded += `
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  barcode TEXT,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`
      }

      // Customers table
      if (missingTables.includes("customers")) {
        sqlNeeded += `
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_purchases DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`
      }

      // Settings table
      if (missingTables.includes("settings")) {
        sqlNeeded += `
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);
`
      }

      return NextResponse.json({
        success: false,
        message: "Missing tables detected",
        missingTables,
        sqlNeeded,
        tablesCheckResults,
      })
    }

    return NextResponse.json({
      success: true,
      message: "All required tables exist",
      tablesCheckResults,
    })
  } catch (error) {
    console.error("Error in setup-tables route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

