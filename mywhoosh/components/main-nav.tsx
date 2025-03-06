"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  AlertTriangle,
  Receipt,
  PieChart,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { useSidebar } from "@/contexts/sidebar-context"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"

const adminLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Sales", href: "/sales", icon: Receipt },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Expenses", href: "/expenses", icon: CreditCard },
  { name: "User Management", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

const cashierLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
]

export function MainNav({
  isMobile = false,
  onNavItemClick = () => {},
}: {
  isMobile?: boolean
  onNavItemClick?: () => void
}) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { t } = useLanguage()

  const links = profile?.role === "admin" ? adminLinks : cashierLinks

  // Group links by category
  const mainLinks = links.filter((link) => ["/dashboard", "/pos", "/alerts"].includes(link.href))

  const managementLinks = links.filter((link) =>
    ["/inventory", "/sales", "/reports", "/expenses", "/users", "/settings"].includes(link.href),
  )

  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    const fetchLowStockCount = async () => {
      const { data } = await supabase.from("products").select("*")

      // Filter products where stock is less than min_stock
      const lowStock = data?.filter((product) => product.stock < product.min_stock) || []
      setLowStockCount(lowStock.length)
    }

    fetchLowStockCount()
  }, [])

  // Translation map for sidebar items
  const translateNavItem = (name: string) => {
    const translations: Record<string, string> = {
      Dashboard: t("dashboard"),
      "Point of Sale": t("point.of.sale"),
      Inventory: t("inventory"),
      Alerts: t("alerts"),
      Sales: t("sales"),
      Reports: t("reports"),
      Expenses: t("expenses"),
      "User Management": t("user.management"),
      Settings: t("settings"),
      Main: t("main"),
      Management: t("management"),
      Collapse: t("collapse"),
    }

    return translations[name] || name
  }

  // Mobile sidebar has different styling
  if (isMobile) {
    return (
      <div className="py-6 px-2">
        <div className="flex items-center justify-center mb-8">
          <ShoppingCart className="h-6 w-6 mr-2" />
          <span className="text-xl font-bold">Mini Market</span>
        </div>
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="px-2 text-xs font-semibold tracking-tight text-muted-foreground mb-2">
              {translateNavItem("Main")}
            </h2>
            <nav className="grid gap-1">
              {mainLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    onClick={onNavItemClick}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span>{translateNavItem(link.name)}</span>

                    {link.href === "/alerts" && lowStockCount > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-auto bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800"
                      >
                        {lowStockCount}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {profile?.role === "admin" && managementLinks.length > 0 && (
            <div className="space-y-1">
              <h2 className="px-2 text-xs font-semibold tracking-tight text-muted-foreground mb-2">
                {translateNavItem("Management")}
              </h2>
              <nav className="grid gap-1">
                {managementLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      onClick={onNavItemClick}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      <span>{translateNavItem(link.name)}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Desktop sidebar (original implementation)
  return (
    <div
      className={cn(
        "bg-sidebar h-screen border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[60px]" : "w-[240px]",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-4 overflow-y-auto">
          {/* Main section */}
          <div className="space-y-1 px-3">
            {!isCollapsed && (
              <h2 className="px-2 text-xs font-semibold tracking-tight text-muted-foreground mb-2">
                {translateNavItem("Main")}
              </h2>
            )}
            <nav className="grid gap-1">
              {mainLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    title={isCollapsed ? translateNavItem(link.name) : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {!isCollapsed && (
                      <>
                        <span>{translateNavItem(link.name)}</span>

                        {link.href === "/alerts" && lowStockCount > 0 && (
                          <Badge
                            variant="outline"
                            className="ml-auto bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800"
                          >
                            {lowStockCount}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Management section - only for admin */}
          {profile?.role === "admin" && managementLinks.length > 0 && (
            <div className="space-y-1 px-3 mt-6">
              {!isCollapsed && (
                <h2 className="px-2 text-xs font-semibold tracking-tight text-muted-foreground mb-2">
                  {translateNavItem("Management")}
                </h2>
              )}
              <nav className="grid gap-1">
                {managementLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      title={isCollapsed ? translateNavItem(link.name) : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      {!isCollapsed && <span>{translateNavItem(link.name)}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Collapse button at the bottom */}
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground",
              isCollapsed ? "px-2" : "",
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>{translateNavItem("Collapse")}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

