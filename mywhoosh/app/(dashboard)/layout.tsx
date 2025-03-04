"use client"

import type React from "react"

import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/contexts/auth-context"
import { ShoppingCart } from 'lucide-react'
import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      redirect("/login")
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="h-6 w-6" />
            <span>Mini Market</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <UserNav />
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-muted/40 lg:block">
          <div className="flex h-full max-h-screen flex-col gap-2 p-4">
            <MainNav />
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}