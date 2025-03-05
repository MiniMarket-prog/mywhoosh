"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Home, ShoppingCart, Package, Bell, Receipt, DollarSign, BarChart3, Users, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  subItems?: { name: string; href: string }[]
}

export function Sidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  const isAdmin = profile?.role === "admin"

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

  const links = isAdmin ? adminLinks : cashierLinks

  const toggleSubmenu = (name: string) => {
    if (openSubmenu === name) {
      setOpenSubmenu(null)
    } else {
      setOpenSubmenu(name)
    }
  }

  return (
    <div className="w-64 min-h-screen bg-background border-r">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">Mini Market</h2>
        <nav className="space-y-1">
          {links.map((link) => (
            <div key={link.name}>
              {link.subItems ? (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      pathname.startsWith(link.href) ? "bg-muted" : "",
                    )}
                    onClick={() => toggleSubmenu(link.name)}
                  >
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.name}
                    <ChevronDown
                      className={cn(
                        "ml-auto h-4 w-4 transition-transform",
                        openSubmenu === link.name ? "transform rotate-180" : "",
                      )}
                    />
                  </Button>

                  {openSubmenu === link.name && (
                    <div className="ml-6 mt-1 space-y-1">
                      {link.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "block py-2 px-3 text-sm rounded-md",
                            pathname === subItem.href
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center py-2 px-3 text-sm rounded-md",
                    pathname === link.href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

