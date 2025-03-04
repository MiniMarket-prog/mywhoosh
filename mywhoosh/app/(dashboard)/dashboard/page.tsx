"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { BarChart3, DollarSign, Package, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    lowStockCount: 0,
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

    fetchStats()
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.totalProducts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.lowStockCount}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

