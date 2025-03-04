"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Bell, Home, Package, ShoppingCart, Users, Receipt, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const adminLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Sales", href: "/sales", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "User Management", href: "/users", icon: Users },
]

const cashierLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Expenses", href: "/expenses", icon: DollarSign },
]

export function MainNav() {
  const pathname = usePathname()
  const { profile } = useAuth()

  // Default to admin links if profile is not loaded yet
  const links = profile?.role === "cashier" ? cashierLinks : adminLinks

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
              pathname === link.href ? "bg-muted font-medium text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.name}
          </Link>
        )
      })}
    </nav>
  )
}

