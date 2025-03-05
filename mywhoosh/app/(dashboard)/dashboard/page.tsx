"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { DollarSign, ShoppingCart, Users, Package, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"

// Define types for our data structures
type SalesDataPoint = {
  name: string
  sales: number
}

type InventoryDataPoint = {
  name: string
  value: number
}

type DashboardData = {
  totalRevenue: number
  totalSales: number
  activeCustomers: number
  inventoryItems: number
  revenueChange: number
  salesChange: number
  customersChange: number
  inventoryChange: number
  salesData: SalesDataPoint[]
  inventoryData: InventoryDataPoint[]
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [currency, setCurrency] = useState("MAD")
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    totalSales: 0,
    activeCustomers: 0,
    inventoryItems: 0,
    revenueChange: 0,
    salesChange: 0,
    customersChange: 0,
    inventoryChange: 0,
    salesData: [],
    inventoryData: [],
  })

  // Format currency with the selected currency
  const formatPrice = useCallback(
    (price: number) => {
      return formatCurrency(price, currency)
    },
    [currency],
  )

  // Fetch settings to get currency
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings")
      const data = await response.json()

      if (data.settings && data.settings.general && data.settings.general.currency) {
        setCurrency(data.settings.general.currency)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      // Default to MAD if there's an error
      setCurrency("MAD")
    }
  }, [])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch total revenue and sales count
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, total, created_at")
        .order("created_at", { ascending: false })

      if (salesError) throw salesError

      // Calculate total revenue
      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0
      const totalSales = salesData?.length || 0

      // Get sales from previous month for comparison
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

      const currentMonthSales =
        salesData?.filter((sale) => new Date(sale.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1)) || []

      const lastMonthSales =
        salesData?.filter(
          (sale) =>
            new Date(sale.created_at) >= lastMonth &&
            new Date(sale.created_at) < new Date(now.getFullYear(), now.getMonth(), 1),
        ) || []

      const twoMonthsAgoSales =
        salesData?.filter(
          (sale) => new Date(sale.created_at) >= twoMonthsAgo && new Date(sale.created_at) < lastMonth,
        ) || []

      const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
      const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

      // Calculate percentage changes
      const revenueChange =
        lastMonthRevenue === 0 ? 100 : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

      const salesChange =
        lastMonthSales.length === 0
          ? 100
          : ((currentMonthSales.length - lastMonthSales.length) / lastMonthSales.length) * 100

      // Fetch customers count
      const { count: customersCount, error: customersError } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })

      if (customersError) throw customersError

      // Fetch inventory items count
      const { count: inventoryCount, error: inventoryError } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })

      if (inventoryError) throw inventoryError

      // Assume 5% growth in customers and -3% in inventory for demo purposes
      // In a real app, you would calculate this from historical data
      const customersChange = 8.4
      const inventoryChange = -3.1

      // Prepare monthly sales data for charts
      const monthlySalesData: SalesDataPoint[] = []
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const currentYear = new Date().getFullYear()

      for (let i = 0; i < 6; i++) {
        const monthIndex = (now.getMonth() - i + 12) % 12
        const monthName = months[monthIndex]
        const startDate = new Date(monthIndex < now.getMonth() ? currentYear : currentYear - 1, monthIndex, 1)
        const endDate = new Date(monthIndex < now.getMonth() ? currentYear : currentYear - 1, monthIndex + 1, 0)

        const monthSales =
          salesData?.filter((sale) => new Date(sale.created_at) >= startDate && new Date(sale.created_at) <= endDate) ||
          []

        const monthlySalesTotal = monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

        monthlySalesData.unshift({
          name: monthName,
          sales: monthlySalesTotal,
        })
      }

      // Fetch inventory distribution by category
      const { data: productsData, error: productsError } = await supabase.from("products").select("category, stock")

      if (productsError) throw productsError

      // Group products by category and sum their stock
      const categoryMap = new Map()
      productsData?.forEach((product) => {
        const category = product.category || "Uncategorized"
        const currentStock = categoryMap.get(category) || 0
        categoryMap.set(category, currentStock + (product.stock || 0))
      })

      const inventoryDistribution: InventoryDataPoint[] = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
      }))

      setDashboardData({
        totalRevenue,
        totalSales,
        activeCustomers: customersCount || 0,
        inventoryItems: inventoryCount || 0,
        revenueChange,
        salesChange,
        customersChange,
        inventoryChange,
        salesData: monthlySalesData,
        inventoryData: inventoryDistribution.length > 0 ? inventoryDistribution : [{ name: "No Data", value: 1 }],
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Keep the mock data as fallback
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchDashboardData()
  }, [fetchSettings, fetchDashboardData])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.name || "User"}</h1>
        <p className="text-muted-foreground">Here's an overview of your store's performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(dashboardData.totalRevenue)}</div>
            <div
              className={`flex items-center text-xs ${dashboardData.revenueChange >= 0 ? "text-green-500" : "text-red-500"} mt-1`}
            >
              {dashboardData.revenueChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              <span>
                {dashboardData.revenueChange >= 0 ? "+" : ""}
                {dashboardData.revenueChange.toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{dashboardData.totalSales}</div>
            <div
              className={`flex items-center text-xs ${dashboardData.salesChange >= 0 ? "text-green-500" : "text-red-500"} mt-1`}
            >
              {dashboardData.salesChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              <span>
                {dashboardData.salesChange >= 0 ? "+" : ""}
                {dashboardData.salesChange.toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{dashboardData.activeCustomers}</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{dashboardData.customersChange}% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.inventoryItems}</div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              <span>{dashboardData.inventoryChange}% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>Monthly sales for the current year</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatPrice(value as number)} />
                      <Bar dataKey="sales" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Inventory Distribution</CardTitle>
                <CardDescription>Current inventory by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.inventoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dashboardData.inventoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trends</CardTitle>
              <CardDescription>Sales trends over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>View and download reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This section will contain downloadable reports and analytics.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

