"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { BarChart3, DollarSign, Package, ShoppingCart } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface DashboardData {
  totalRevenue: number
  totalSales?: number
  totalProducts?: number
  totalExpenses?: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [currency, setCurrency] = useState("MAD")
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    totalExpenses: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simulate API call with a delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Fetch products count
        const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })

        // Fetch sales data
        const { data: sales } = await supabase.from("sales").select("*")

        // Calculate total revenue and sales count
        let totalRevenue = 0
        if (sales) {
          totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        }

        // Fetch expenses data
        const { data: expenses } = await supabase.from("expenses").select("*")

        // Calculate total expenses
        let totalExpenses = 0
        if (expenses) {
          totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
        }

        setDashboardData({
          totalRevenue,
          totalSales: sales?.length || 0,
          totalProducts: productsCount || 0,
          totalExpenses,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = useCallback(
    (value: number) => {
      return new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: currency,
      }).format(value)
    },
    [currency],
  )

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
          <TabsTrigger value="reports">{t("reports")}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("total.revenue")}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">+20.1% {t("from.last.month")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("sales")}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalSales}</div>
                <p className="text-xs text-muted-foreground">+15% {t("from.last.month")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("products")}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalProducts}</div>
                <p className="text-xs text-muted-foreground">+12 {t("new.products")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("expenses")}</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalExpenses || 0)}</div>
                <p className="text-xs text-muted-foreground">+7% {t("from.last.month")}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="h-[400px] flex items-center justify-center bg-muted/50 rounded-md">
          <p className="text-muted-foreground">{t("analytics.coming.soon")}</p>
        </TabsContent>
        <TabsContent value="reports" className="h-[400px] flex items-center justify-center bg-muted/50 rounded-md">
          <p className="text-muted-foreground">{t("reports.coming.soon")}</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}

