"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { CalendarIcon, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TopProduct = {
  product_id: string
  product_name: string
  total_quantity: number
  total_sales: number
}

type DailySales = {
  date: string
  total: number
  count: number
}

type PaymentMethodStats = {
  payment_method: string
  count: number
  total: number
}

type CategoryStats = {
  category: string
  count: number
  total: number
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales")
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [predefinedRange, setPredefinedRange] = useState("30days")
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStats[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [averageOrderValue, setAverageOrderValue] = useState(0)
  const { profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [profile, router])

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchReportData()
    }
  }, [dateRange])

  const handlePredefinedRangeChange = (value: string) => {
    setPredefinedRange(value)

    const today = new Date()
    let from: Date
    let to: Date = today

    switch (value) {
      case "7days":
        from = subDays(today, 7)
        break
      case "30days":
        from = subDays(today, 30)
        break
      case "thisMonth":
        from = startOfMonth(today)
        break
      case "lastMonth":
        to = endOfMonth(subDays(startOfMonth(today), 1))
        from = startOfMonth(to)
        break
      case "thisYear":
        from = startOfYear(today)
        break
      default:
        from = subDays(today, 30)
    }

    setDateRange({ from, to })
  }

  const fetchReportData = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    setIsLoading(true)

    try {
      await Promise.all([
        fetchSalesOverview(),
        fetchTopProducts(),
        fetchDailySales(),
        fetchPaymentMethodStats(),
        fetchCategoryStats(),
      ])
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSalesOverview = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    // Get sales from the date range
    const { data: sales, error } = await supabase
      .from("sales")
      .select("total")
      .gte("created_at", fromDate)
      .lte("created_at", toDate)

    if (error) throw error

    if (!sales || sales.length === 0) {
      setTotalSales(0)
      setTotalRevenue(0)
      setAverageOrderValue(0)
      return
    }

    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0)

    setTotalSales(sales.length)
    setTotalRevenue(revenue)
    setAverageOrderValue(sales.length > 0 ? revenue / sales.length : 0)
  }

  const fetchTopProducts = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    // Get sales from the date range
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("id")
      .gte("created_at", fromDate)
      .lte("created_at", toDate)

    if (salesError) throw salesError

    if (!sales || sales.length === 0) {
      setTopProducts([])
      return
    }

    const saleIds = sales.map((sale) => sale.id)

    // Get sale items
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("product_id, quantity, subtotal")
      .in("sale_id", saleIds)

    if (itemsError) throw itemsError

    if (!items || items.length === 0) {
      setTopProducts([])
      return
    }

    // Aggregate by product
    const productMap = new Map<string, { quantity: number; sales: number }>()

    items.forEach((item) => {
      const existing = productMap.get(item.product_id)
      if (existing) {
        existing.quantity += item.quantity
        existing.sales += item.subtotal
      } else {
        productMap.set(item.product_id, {
          quantity: item.quantity,
          sales: item.subtotal,
        })
      }
    })

    // Get product names
    const productIds = Array.from(new Set(items.map((item) => item.product_id)))
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds)

    if (productsError) throw productsError

    // Create final list
    const topProductsList =
      products?.map((product) => {
        const stats = productMap.get(product.id)
        return {
          product_id: product.id,
          product_name: product.name,
          total_quantity: stats?.quantity || 0,
          total_sales: stats?.sales || 0,
        }
      }) || []

    // Sort by total sales
    topProductsList.sort((a, b) => b.total_sales - a.total_sales)

    setTopProducts(topProductsList.slice(0, 10))
  }

  const fetchDailySales = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    // Get sales from the date range
    const { data: sales, error } = await supabase
      .from("sales")
      .select("created_at, total")
      .gte("created_at", fromDate)
      .lte("created_at", toDate)
      .order("created_at")

    if (error) throw error

    if (!sales || sales.length === 0) {
      setDailySales([])
      return
    }

    // Aggregate by day
    const dailyMap = new Map<string, { total: number; count: number }>()

    sales.forEach((sale) => {
      const date = new Date(sale.created_at).toISOString().split("T")[0]
      const existing = dailyMap.get(date)
      if (existing) {
        existing.total += sale.total
        existing.count += 1
      } else {
        dailyMap.set(date, {
          total: sale.total,
          count: 1,
        })
      }
    })

    // Create final list
    const dailySalesList = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      count: stats.count,
    }))

    // Sort by date
    dailySalesList.sort((a, b) => a.date.localeCompare(b.date))

    setDailySales(dailySalesList)
  }

  const fetchPaymentMethodStats = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    // Get sales from the date range
    const { data: sales, error } = await supabase
      .from("sales")
      .select("payment_method, total")
      .gte("created_at", fromDate)
      .lte("created_at", toDate)

    if (error) throw error

    if (!sales || sales.length === 0) {
      setPaymentStats([])
      return
    }

    // Aggregate by payment method
    const paymentMap = new Map<string, { count: number; total: number }>()

    sales.forEach((sale) => {
      const existing = paymentMap.get(sale.payment_method)
      if (existing) {
        existing.count += 1
        existing.total += sale.total
      } else {
        paymentMap.set(sale.payment_method, {
          count: 1,
          total: sale.total,
        })
      }
    })

    // Create final list
    const paymentStatsList = Array.from(paymentMap.entries()).map(([payment_method, stats]) => ({
      payment_method,
      count: stats.count,
      total: stats.total,
    }))

    // Sort by total
    paymentStatsList.sort((a, b) => b.total - a.total)

    setPaymentStats(paymentStatsList)
  }

  const fetchCategoryStats = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    // Get sales from the date range
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("id")
      .gte("created_at", fromDate)
      .lte("created_at", toDate)

    if (salesError) throw salesError

    if (!sales || sales.length === 0) {
      setCategoryStats([])
      return
    }

    const saleIds = sales.map((sale) => sale.id)

    // Get sale items with products
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("product_id, quantity, subtotal")
      .in("sale_id", saleIds)

    if (itemsError) throw itemsError

    if (!items || items.length === 0) {
      setCategoryStats([])
      return
    }

    // Get products with categories
    const productIds = [...new Set((items || []).map((item) => item?.product_id))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, category")
      .in("id", productIds)

    if (productsError) throw productsError

    // Create product to category map
    const productCategoryMap = new Map<string, string>()
    products?.forEach((product) => {
      productCategoryMap.set(product.id, product.category)
    })

    // Aggregate by category
    const categoryMap = new Map<string, { count: number; total: number }>()

    items.forEach((item) => {
      const category = productCategoryMap.get(item.product_id) || "unknown"
      const existing = categoryMap.get(category)
      if (existing) {
        existing.count += item.quantity
        existing.total += item.subtotal
      } else {
        categoryMap.set(category, {
          count: item.quantity,
          total: item.subtotal,
        })
      }
    })

    // Create final list
    const categoryStatsList = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      total: stats.total,
    }))

    // Sort by total
    categoryStatsList.sort((a, b) => b.total - a.total)

    setCategoryStats(categoryStatsList)
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return

    // Get headers from first object
    const headers = Object.keys(data[0])

    // Convert data to CSV
    const csvRows = []

    // Add headers
    csvRows.push(headers.join(","))

    // Add rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header]
        // Handle strings with commas by wrapping in quotes
        return typeof value === "string" && value.includes(",") ? `"${value}"` : value
      })
      csvRows.push(values.join(","))
    }

    // Create CSV content
    const csvContent = csvRows.join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analyze your sales data and performance metrics.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={predefinedRange} onValueChange={handlePredefinedRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
              <SelectItem value="thisYear">This year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {predefinedRange === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal w-[240px]", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-muted"></div> : totalSales}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                : "Select a date range"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
              ) : (
                `$${totalRevenue.toFixed(2)}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                : "Select a date range"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
              ) : (
                `$${averageOrderValue.toFixed(2)}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                : "Select a date range"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
              ) : topProducts.length > 0 ? (
                topProducts[0].product_name
              ) : (
                "No data"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {topProducts.length > 0 ? `$${topProducts[0].total_sales.toFixed(2)} in sales` : "No sales in period"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Over Time</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sales Over Time</CardTitle>
                <CardDescription>Daily sales during the selected period</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCSV(dailySales, "daily_sales")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] w-full animate-pulse rounded bg-muted"></div>
              ) : dailySales.length > 0 ? (
                <div className="h-[300px] w-full">
                  {/* This would be a chart in a real implementation */}
                  <div className="space-y-8">
                    <div className="border rounded-md">
                      <div className="p-4 border-b">
                        <h3 className="font-medium">Daily Sales Data</h3>
                      </div>
                      <div className="p-4">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-left font-medium">Date</th>
                              <th className="text-right font-medium">Orders</th>
                              <th className="text-right font-medium">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailySales.map((day) => (
                              <tr key={day.date} className="border-t">
                                <td className="py-2">{format(new Date(day.date), "MMM d, yyyy")}</td>
                                <td className="py-2 text-right">{day.count}</td>
                                <td className="py-2 text-right">${day.total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">No sales data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling products during the selected period</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCSV(topProducts, "top_products")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : topProducts.length > 0 ? (
                <div className="space-y-8">
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">Top 10 Products by Revenue</h3>
                    </div>
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left font-medium">Product</th>
                            <th className="text-right font-medium">Quantity</th>
                            <th className="text-right font-medium">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProducts.map((product) => (
                            <tr key={product.product_id} className="border-t">
                              <td className="py-2">{product.product_name}</td>
                              <td className="py-2 text-right">{product.total_quantity}</td>
                              <td className="py-2 text-right">${product.total_sales.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">No product data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Sales by payment method during the selected period</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCSV(paymentStats, "payment_methods")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-full h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : paymentStats.length > 0 ? (
                <div className="space-y-8">
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">Payment Method Breakdown</h3>
                    </div>
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left font-medium">Payment Method</th>
                            <th className="text-right font-medium">Orders</th>
                            <th className="text-right font-medium">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentStats.map((method) => (
                            <tr key={method.payment_method} className="border-t">
                              <td className="py-2 capitalize">{method.payment_method}</td>
                              <td className="py-2 text-right">{method.count}</td>
                              <td className="py-2 text-right">${method.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">No payment data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Sales by product category during the selected period</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCSV(categoryStats, "categories")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : categoryStats.length > 0 ? (
                <div className="space-y-8">
                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">Category Breakdown</h3>
                    </div>
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left font-medium">Category</th>
                            <th className="text-right font-medium">Items Sold</th>
                            <th className="text-right font-medium">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryStats.map((category) => (
                            <tr key={category.category} className="border-t">
                              <td className="py-2 capitalize">{category.category}</td>
                              <td className="py-2 text-right">{category.count}</td>
                              <td className="py-2 text-right">${category.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">No category data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

