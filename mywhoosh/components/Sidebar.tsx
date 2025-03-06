"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  Home,
  ShoppingCart,
  Package,
  Bell,
  Receipt,
  DollarSign,
  BarChart3,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  Database,
} from "lucide-react"
import { useState, useEffect } from "react"
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
  const [collapsed, setCollapsed] = useState(false)

  // Check for saved collapsed state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState) {
      setCollapsed(savedState === "true")
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  const isAdmin = profile?.role === "admin"

  // Define links with Settings for both admin and cashier
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
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Setup", href: "/setup", icon: Database }, // Added Setup link for admin
  ]

  const cashierLinks: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
    { name: "Alerts", href: "/alerts", icon: Bell },
    { name: "Expenses", href: "/expenses", icon: DollarSign },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  // Use the appropriate links array based on user role
  const links = isAdmin ? adminLinks : cashierLinks

  const toggleSubmenu = (name: string) => {
    if (openSubmenu === name) {
      setOpenSubmenu(null)
    } else {
      setOpenSubmenu(name)
    }
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-background border-r transition-all duration-300 relative",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {/* Collapse toggle button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 bg-background border border-border rounded-full p-1 shadow-md z-10 hover:bg-muted"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {!collapsed ? (
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Mini Market
            </h2>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-xl font-bold text-primary">M</span>
            </div>
          )}
        </div>

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
                      collapsed ? "px-3 justify-center" : "",
                    )}
                    onClick={() => !collapsed && toggleSubmenu(link.name)}
                  >
                    <link.icon
                      className={cn(
                        "h-4 w-4",
                        collapsed ? "" : "mr-2",
                        pathname.startsWith(link.href) ? "text-primary" : "text-muted-foreground",
                      )}
                    />

                    {!collapsed && (
                      <>
                        {link.name}
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4 transition-transform",
                            openSubmenu === link.name ? "transform rotate-180" : "",
                          )}
                        />
                      </>
                    )}
                  </Button>

                  {openSubmenu === link.name && !collapsed && (
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
                    collapsed ? "justify-center" : "",
                  )}
                >
                  <link.icon
                    className={cn("h-4 w-4", collapsed ? "" : "mr-2", pathname === link.href ? "text-primary" : "")}
                  />
                  {!collapsed && link.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

