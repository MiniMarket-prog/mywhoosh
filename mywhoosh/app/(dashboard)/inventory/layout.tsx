import type React from "react"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Inventory | Mini Market",
  description: "Manage your inventory and products",
}

export const viewport: Viewport = {
  themeColor: "#000000",
}

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

