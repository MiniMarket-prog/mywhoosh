"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { BarChart3, DollarSign, Package, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [currency, setCurrency] = useState("MAD")
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)

      // Get total products
      const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true })

      // Get low stock products
      const { count: lowStockCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .lt("stock", 10)

      // Get total sales
      const { count: totalSales } = await supabase.from("sales").select("*", { count: "exact", head: true })

      // Get total revenue
      const { data: salesData } = await supabase.from("sales").select("total")

      const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0

      setStats({
        totalProducts: totalProducts || 0,
        lowStockCount: lowStockCount || 0,
        totalSales: totalSales || 0,
        totalRevenue,
      })

      setIsLoading(false)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.full_name || profile?.username}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOTAL PRODUCT COST</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
              ) : (
                `$${stats.totalRevenue.toFixed(2)}`
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center mr-1">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                2.5%
              </span>
              vs. previous month
            </div>
            {!isLoading && (
              <div className="mt-3 h-1 w-full bg-muted overflow-hidden rounded-full">
                <div className="bg-blue-500 h-1 w-3/4 rounded-full"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.totalSales}
            </div>
            {!isLoading && (
              <div className="mt-3 h-1 w-full bg-muted overflow-hidden rounded-full">
                <div className="bg-green-500 h-1 w-4/5 rounded-full"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{dashboardData.activeCustomers}</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{dashboardData.customersChange}% from last month</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center mr-1">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                1.8%
              </span>
              vs. previous month
            </div>
            {!isLoading && (
              <div className="mt-3 h-1 w-full bg-muted overflow-hidden rounded-full">
                <div className="bg-purple-500 h-1 w-2/3 rounded-full"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.inventoryItems}</div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              <span>{dashboardData.inventoryChange}% from last month</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-red-500 flex items-center mr-1">
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
                3.1%
              </span>
              vs. previous month
            </div>
            {!isLoading && (
              <div className="mt-3 h-1 w-full bg-muted overflow-hidden rounded-full">
                <div className="bg-amber-500 h-1 w-1/2 rounded-full"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

