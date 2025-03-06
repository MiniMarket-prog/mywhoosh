"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { Wallet } from "lucide-react"
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
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, dir } = useLanguage()
  const { user } = useAuth()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/")
  }

  const isSubItemActive = (path: string) => {
    return pathname === path
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const sidebarLinks = [
    { name: t("dashboard"), href: "/dashboard", icon: Home },
    { name: t("inventory"), href: "/inventory", icon: Package },
    { name: t("pos"), href: "/pos", icon: ShoppingCart },
    { name: t("sales"), href: "/sales", icon: ClipboardList },
    { name: t("expenses"), href: "/expenses", icon: Wallet },
    { name: t("users"), href: "/users", icon: Users },
    {
      name: t("reports"),
      href: "/reports",
      icon: BarChart3,
      subItems: [
        { name: t("sales.comparison"), href: "/reports/comparison", icon: DollarSign },
        { name: t("income.vs.expenses"), href: "/reports/income-expenses", icon: BarChart3 },
        { name: t("financial.goals"), href: "/reports/goals", icon: Target },
        { name: t("commissions"), href: "/reports/commissions", icon: Percent },
      ],
    },
    { name: t("settings"), href: "/settings", icon: Settings },
    { name: t("setup"), href: "/setup", icon: Database },
  ]

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col h-screen" dir={dir}>
      <div className="text-xl font-bold mb-8">{t("Mini-Market")}</div>
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
        <button
          onClick={() => setIsLogoutDialogOpen(true)}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>{t("app.logout")}</span>
        </button>
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("logout.confirmation")}</AlertDialogTitle>
            <AlertDialogDescription>{t("logout.message")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>{t("logout")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}

