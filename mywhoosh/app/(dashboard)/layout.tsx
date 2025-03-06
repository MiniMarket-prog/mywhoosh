import type React from "react"
import { Sidebar } from "@/components/Sidebar"
import { Toaster } from "@/components/ui/toaster"
import { LanguageDirectionWrapper } from "@/components/LanguageDirectionWrapper"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-auto">
        <LanguageDirectionWrapper>
          <div className="max-w-7xl mx-auto">{children}</div>
        </LanguageDirectionWrapper>
      </main>
      <Toaster />
    </div>
  )
}

