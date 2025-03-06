"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Simplified active tab detection
  let activeTab = "sales"
  if (pathname.includes("/reports/finance")) activeTab = "finance"
  if (pathname.includes("/reports/goals")) activeTab = "goals"
  if (pathname.includes("/reports/commissions")) activeTab = "commissions"

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View and analyze your business performance</p>
      </div>
      <div className="space-y-6">
        <div className="border-b">
          <div className="flex space-x-4">
            <Link
              href="/reports"
              className={`py-2 px-4 border-b-2 ${activeTab === "sales" ? "border-primary text-primary" : "border-transparent"}`}
            >
              Sales Reports
            </Link>
            <Link
              href="/reports/finance"
              className={`py-2 px-4 border-b-2 ${activeTab === "finance" ? "border-primary text-primary" : "border-transparent"}`}
            >
              Financial Reports
            </Link>
            <Link
              href="/reports/goals"
              className={`py-2 px-4 border-b-2 ${activeTab === "goals" ? "border-primary text-primary" : "border-transparent"}`}
            >
              Financial Goals
            </Link>
            <Link
              href="/reports/commissions"
              className={`py-2 px-4 border-b-2 ${activeTab === "commissions" ? "border-primary text-primary" : "border-transparent"}`}
            >
              Commissions
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

