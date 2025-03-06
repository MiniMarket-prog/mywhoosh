import { NextResponse } from "next/server"

export interface AllSettings {
  general: {
    storeName: string
    address: string
    phone: string
    email: string
    currency: string
  }
  receipt: {
    headerText: string
    footerText: string
    showLogo: boolean
    printReceipt: boolean
    emailReceipt: boolean
  }
  tax: {
    enableTax: boolean
    taxRate: number
    taxName: string
    taxIncluded: boolean
  }
  preferences: {
    theme: string
    language: string
    dateFormat: string
    timeFormat: string
  }
}

// Mock settings data
let settings: AllSettings = {
  general: {
    storeName: "Mini Market",
    address: "123 Market Street, City, Country",
    phone: "+1 234 567 8900",
    email: "contact@minimarket.com",
    currency: "USD",
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

export async function GET() {
  // In a real app, you would fetch settings from a database
  return NextResponse.json({ settings })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { section, settings: sectionSettings } = body

    if (!section || !sectionSettings) {
      return NextResponse.json({ error: "Missing required fields: section and settings" }, { status: 400 })
    }

    // Validate section
    if (!["general", "receipt", "tax", "preferences"].includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 })
    }

    // Update settings
    settings = {
      ...settings,
      [section]: sectionSettings,
    }

    // In a real app, you would save settings to a database here

    return NextResponse.json({
      message: "Settings updated successfully",
      settings,
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

