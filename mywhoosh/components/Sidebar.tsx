"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import {
  BarChart3,
  ClipboardList,
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  DollarSign,
  Target,
  Percent,
  Database,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { t, dir } = useLanguage()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/")
  }

  const isSubItemActive = (path: string) => {
    return pathname === path
  }

  const sidebarLinks = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: Home },
    { name: t("nav.inventory"), href: "/inventory", icon: Package },
    { name: t("nav.pos"), href: "/pos", icon: ShoppingCart },
    { name: t("nav.sales"), href: "/sales", icon: ClipboardList },
    { name: t("nav.customers"), href: "/customers", icon: Users },
    {
      name: t("nav.reports"),
      href: "/reports",
      icon: BarChart3,
      subItems: [
        { name: "Sales Comparison", href: "/reports/comparison", icon: DollarSign },
        { name: "Income vs Expenses", href: "/reports/income-expenses", icon: BarChart3 },
        { name: "Financial Goals", href: "/reports/goals", icon: Target },
        { name: "Commissions", href: "/reports/commissions", icon: Percent },
      ],
    },
    { name: t("nav.settings"), href: "/settings", icon: Settings },
    { name: t("nav.setup"), href: "/setup", icon: Database },
  ]

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col h-screen" dir={dir}>
      <div className="text-xl font-bold mb-8">{t("app.name")}</div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {sidebarLinks.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive(link.href) ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
              {link.subItems && isActive(link.href) && (
                <ul className="ml-6 mt-1 space-y-1">
                  {link.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                          isSubItemActive(subItem.href)
                            ? "bg-gray-700 text-white"
                            : "text-gray-400 hover:bg-gray-700 hover:text-white"
                        }`}
                      >
                        <subItem.icon className="h-4 w-4" />
                        <span className="text-sm">{subItem.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-gray-700 pt-4 mt-6">
        <button className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white w-full">
          <LogOut className="h-5 w-5" />
          <span>{t("app.logout")}</span>
        </button>
      </div>
    </aside>
  )
}

