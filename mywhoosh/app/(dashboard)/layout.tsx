import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { UserNav } from "@/components/user-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <header className="border-b h-14 flex items-center px-4 justify-end">
          <UserNav />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

