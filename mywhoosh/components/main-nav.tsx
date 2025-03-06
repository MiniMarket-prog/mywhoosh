"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Bell, Home, Package, ShoppingCart, Users, Receipt, DollarSign } from "lucide-react"

// Try to import useAuth, but provide a fallback if it fails
let useAuth: () => { profile?: { role?: string } } = () => ({ profile: { role: "admin" } })
try {
  const authModule = require("@/contexts/auth-context")
  useAuth = authModule.useAuth
} catch (error) {
  console.warn("Auth context not available, defaulting to admin role")
}

interface SubNavItem {
  name: string
  href: string
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  subItems?: SubNavItem[]
}

const adminLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Sales", href: "/sales", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: DollarSign },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    subItems: [
      { name: "Sales Reports", href: "/reports" },
      { name: "Financial Reports", href: "/reports/finance" },
      { name: "Financial Goals", href: "/reports/goals" },
      { name: "Commissions", href: "/reports/commissions" },
    ],
  },
  { name: "User Management", href: "/users", icon: Users },
]

const cashierLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Expenses", href: "/expenses", icon: DollarSign },
]

export function MainNav() {
  const pathname = usePathname()

  // Always call useAuth to prevent hook errors, and default to admin if not available
  let auth
  try {
    auth = useAuth()
  } catch (error) {
    console.warn("Error accessing auth context:", error)
    auth = { profile: { role: "admin" } }
  }
  const profile = auth?.profile

  // Default to admin links if profile is not loaded yet
  const links = profile?.role === "cashier" ? cashierLinks : adminLinks

  // Add support for showing subItems when on a subpage
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu</div>
      {links.map((link) => {
        const Icon = link.icon
        const active = isActive(link.href)

        return (
          <div key={link.href} className="mb-1">
            <Link
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary",
                active ? "bg-primary/10 text-primary" : "text-gray-700 dark:text-gray-300",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.name}
            </Link>

            {/* Render subItems if they exist and the parent is active */}
            {link.subItems && active && (
              <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-2">
                {link.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all hover:text-primary",
                      pathname === subItem.href ? "text-primary" : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    {subItem.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

