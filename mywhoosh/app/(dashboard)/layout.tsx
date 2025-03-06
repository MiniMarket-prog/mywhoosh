"use client"

import type React from "react"

import { Sidebar } from "@/components/Sidebar"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/contexts/auth-context"
import { LanguageProvider } from "@/contexts/language-context"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { ShoppingCart, Menu } from "lucide-react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    <LanguageProvider>
      <SidebarProvider>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b bg-background">
            <div className="flex h-16 items-center px-4 md:px-6">
              {/* Mobile menu button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="mr-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[80%] max-w-[280px]">
                  <div className="h-full overflow-y-auto">
                    <Sidebar />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 font-semibold">
                <ShoppingCart className="h-6 w-6" />
                <span className="hidden sm:inline">Mini Market</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <UserNav />
              </div>
            </div>
          </header>
          <div className="flex flex-1">
            {/* Desktop sidebar */}
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <main className="flex-1 p-3 md:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </LanguageProvider>
  )
}

