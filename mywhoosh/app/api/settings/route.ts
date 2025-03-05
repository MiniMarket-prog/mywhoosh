import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Define types for settings
export type GeneralSettings = {
  storeName: string
  address: string
  phone: string
  email: string
  currency: string
}

export type ReceiptSettings = {
  headerText: string
  footerText: string
  showLogo: boolean
  printReceipt: boolean
  emailReceipt: boolean
}

export type TaxSettings = {
  enableTax: boolean
  taxRate: number
  taxName: string
  taxIncluded: boolean
}

export type PreferenceSettings = {
  theme: string
  language: string
  dateFormat: string
  timeFormat: string
}

export type AllSettings = {
  general: GeneralSettings
  receipt: ReceiptSettings
  tax: TaxSettings
  preferences: PreferenceSettings
}

// Mock settings for fallback
const mockSettings: AllSettings = {
  general: {
    storeName: "Mini Market",
    address: "123 Market Street, City, Country",
    phone: "+1 234 567 8900",
    email: "contact@minimarket.com",
    currency: "MAD",
  },
  receipt: {
    headerText: "Thank you for shopping at Mini Market!",
    footerText: "Please come again!",
    showLogo: true,
    printReceipt: true,
    emailReceipt: false,
  },
  tax: {
    enableTax: true,
    taxRate: 7.5,
    taxName: "Sales Tax",
    taxIncluded: false,
  },
  preferences: {
    theme: "light",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
}

// GET handler to fetch all settings
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Missing Supabase credentials, using mock data")
      return NextResponse.json({ settings: mockSettings })
    }

    // Create Supabase client without the cookies option
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all settings from the database
    const { data, error } = await supabase.from("settings").select("id, value")

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ settings: mockSettings })
    }

    // Transform the data into the expected format
    const settings: Partial<AllSettings> = {}
    data.forEach((item) => {
      settings[item.id as keyof AllSettings] = item.value
    })

    // Merge with mock data to ensure all properties exist
    const mergedSettings: AllSettings = {
      general: { ...mockSettings.general, ...settings.general },
      receipt: { ...mockSettings.receipt, ...settings.receipt },
      tax: { ...mockSettings.tax, ...settings.tax },
      preferences: { ...mockSettings.preferences, ...settings.preferences },
    }

    return NextResponse.json({ settings: mergedSettings })
  } catch (error) {
    console.error("Error in settings API route:", error)
    return NextResponse.json({ settings: mockSettings })
  }
}

// POST handler to update settings
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { settings, section } = body

    if (!section || !settings) {
      return NextResponse.json({ error: "Missing section or settings data" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Missing Supabase credentials, simulating success")
      return NextResponse.json({ success: true, message: `${section} settings updated (mock)` })
    }

    // Create Supabase client without the cookies option
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the current user for the updated_by field - this is optional
    let userId = null
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id
    } catch (error) {
      console.warn("Could not get current user, continuing without user ID")
    }

    // Update the settings in the database
    const { error } = await supabase
      .from("settings")
      .update({
        value: settings,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", section)

    if (error) {
      console.error(`Error updating ${section} settings:`, error)
      return NextResponse.json({ error: `Failed to update ${section} settings` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `${section} settings updated successfully` })
  } catch (error) {
    console.error("Error in settings API route:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

