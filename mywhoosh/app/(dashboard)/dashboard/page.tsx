"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { BarChart3, DollarSign, Package, ShoppingCart, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalRevenue: 0,
    totalProductCost: 0,
    recentSales: [] as any[],
    lastUpdated: new Date(),
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)

      try {
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

        // Get all products to calculate total product cost
        const { data: productsData } = await supabase.from("products").select("cost_price, stock")

        // Calculate total product cost (cost_price * stock for each product)
        const totalProductCost =
          productsData?.reduce((sum, product) => {
            return sum + product.cost_price * product.stock
          }, 0) || 0

        // Get recent sales
        const { data: recentSalesData } = await supabase
          .from("sales")
          .select(`
            id, 
            created_at, 
            total, 
            payment_method,
            cashier_id,
            profiles(full_name, username)
          `)
          .order("created_at", { ascending: false })
          .limit(5)

        const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0

        setStats({
          totalProducts: totalProducts || 0,
          lowStockCount: lowStockCount || 0,
          totalSales: totalSales || 0,
          totalRevenue,
          totalProductCost,
          recentSales: recentSalesData || [],
          lastUpdated: new Date(),
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.full_name || profile?.username}!</p>
        <p className="text-xs text-muted-foreground mt-1">
          <Clock className="inline-block h-3 w-3 mr-1" />
          Last updated: {format(stats.lastUpdated, "MMM d, yyyy h:mm a")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOTAL PRODUCT COST</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
              ) : (
                `$${stats.totalProductCost.toFixed(2)}`
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

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOTAL REVENUE</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
                4.2%
              </span>
              vs. previous month
            </div>
            {!isLoading && (
              <div className="mt-3 h-1 w-full bg-muted overflow-hidden rounded-full">
                <div className="bg-green-500 h-1 w-4/5 rounded-full"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOTAL PRODUCTS</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.totalProducts}
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

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LOW STOCK ITEMS</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.lowStockCount}
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

      {/* Recent Sales Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
        <div className="rounded-lg border bg-card">
          <div className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cashier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-16 ml-auto animate-pulse rounded bg-muted"></div>
                        </td>
                      </tr>
                    ))
                ) : stats.recentSales.length > 0 ? (
                  stats.recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{formatDate(sale.created_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        {sale.profiles?.full_name || sale.profiles?.username || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{sale.payment_method}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${sale.total.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No recent sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

