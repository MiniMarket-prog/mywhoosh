"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format"
import { Loader2 } from "lucide-react"

// Define types for our data structures
type ComparisonDataPoint = {
  date: string
  thisYear: number
  lastYear: number
}

export default function SalesComparisonPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("monthly")
  const [currency, setCurrency] = useState("MAD")
  const [dailyData, setDailyData] = useState<ComparisonDataPoint[]>([])
  const [weeklyData, setWeeklyData] = useState<ComparisonDataPoint[]>([])
  const [monthlyData, setMonthlyData] = useState<ComparisonDataPoint[]>([])

  // Format currency with the selected currency
  const formatPrice = useCallback(
    (price: number) => {
      return formatCurrency(price, currency)
    },
    [currency],
  )

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

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

  // Fetch sales comparison data
  const fetchSalesData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch all sales data
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, total, created_at")
        .order("created_at", { ascending: false })

      if (salesError) throw salesError

      if (!salesData || salesData.length === 0) {
        // If no data, use mock data
        setDailyData([
          { date: "Mon", thisYear: 1200, lastYear: 1000 },
          { date: "Tue", thisYear: 1500, lastYear: 1300 },
          { date: "Wed", thisYear: 1800, lastYear: 1600 },
          { date: "Thu", thisYear: 1200, lastYear: 1400 },
          { date: "Fri", thisYear: 2000, lastYear: 1800 },
          { date: "Sat", thisYear: 2500, lastYear: 2200 },
          { date: "Sun", thisYear: 1800, lastYear: 1500 },
        ])
        setWeeklyData([
          { date: "Week 1", thisYear: 8000, lastYear: 7500 },
          { date: "Week 2", thisYear: 9500, lastYear: 8800 },
          { date: "Week 3", thisYear: 8800, lastYear: 9000 },
          { date: "Week 4", thisYear: 10200, lastYear: 9500 },
        ])
        setMonthlyData([
          { date: "Jan", thisYear: 35000, lastYear: 32000 },
          { date: "Feb", thisYear: 38000, lastYear: 35000 },
          { date: "Mar", thisYear: 42000, lastYear: 38000 },
          { date: "Apr", thisYear: 40000, lastYear: 37000 },
          { date: "May", thisYear: 45000, lastYear: 41000 },
          { date: "Jun", thisYear: 48000, lastYear: 43000 },
          { date: "Jul", thisYear: 46000, lastYear: 42000 },
          { date: "Aug", thisYear: 49000, lastYear: 45000 },
          { date: "Sep", thisYear: 51000, lastYear: 47000 },
          { date: "Oct", thisYear: 50000, lastYear: 46000 },
          { date: "Nov", thisYear: 53000, lastYear: 48000 },
          { date: "Dec", thisYear: 55000, lastYear: 50000 },
        ])
        setIsLoading(false)
        return
      }

      // Get current date info
      const now = new Date()
      const currentYear = now.getFullYear()
      const lastYear = currentYear - 1

      // Process monthly data
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const monthlyComparison: ComparisonDataPoint[] = []

      for (let month = 0; month < 12; month++) {
        // This year's data for this month
        const thisYearSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return saleDate.getFullYear() === currentYear && saleDate.getMonth() === month
        })

        // Last year's data for this month
        const lastYearSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return saleDate.getFullYear() === lastYear && saleDate.getMonth() === month
        })

        // Calculate totals
        const thisYearTotal = thisYearSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        const lastYearTotal = lastYearSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

        monthlyComparison.push({
          date: months[month],
          thisYear: thisYearTotal,
          lastYear: lastYearTotal,
        })
      }

      setMonthlyData(monthlyComparison)

      // Process weekly data
      const weeklyComparison: ComparisonDataPoint[] = []

      // Get the current week number (0-indexed)
      const getWeekNumber = (date: Date) => {
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        return Math.floor((date.getDate() - 1 + firstDayOfMonth.getDay()) / 7)
      }

      // Current month only
      const currentMonth = now.getMonth()

      for (let week = 0; week < 4; week++) {
        // This year's data for this week
        const thisYearSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return (
            saleDate.getFullYear() === currentYear &&
            saleDate.getMonth() === currentMonth &&
            getWeekNumber(saleDate) === week
          )
        })

        // Last year's data for this week
        const lastYearSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return (
            saleDate.getFullYear() === lastYear &&
            saleDate.getMonth() === currentMonth &&
            getWeekNumber(saleDate) === week
          )
        })

        // Calculate totals
        const thisYearTotal = thisYearSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        const lastYearTotal = lastYearSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

        weeklyComparison.push({
          date: `Week ${week + 1}`,
          thisYear: thisYearTotal,
          lastYear: lastYearTotal,
        })
      }

      setWeeklyData(weeklyComparison)

      // Process daily data
      const dailyComparison: ComparisonDataPoint[] = []
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

      // Get start of current week
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      // Get start of same week last year
      const startOfWeekLastYear = new Date(startOfWeek)
      startOfWeekLastYear.setFullYear(lastYear)

      for (let day = 0; day < 7; day++) {
        const currentDay = new Date(startOfWeek)
        currentDay.setDate(startOfWeek.getDate() + day)

        const sameDayLastYear = new Date(startOfWeekLastYear)
        sameDayLastYear.setDate(startOfWeekLastYear.getDate() + day)

        // This year's data for this day
        const thisYearSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return (
            saleDate.getFullYear() === currentYear &&
            saleDate.getMonth() === currentDay.getMonth() &&
            saleDate.getDate() === currentDay.getDate()
          )
        })

        // Last year's data for this day
        const lastYearSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return (
            saleDate.getFullYear() === lastYear &&
            saleDate.getMonth() === sameDayLastYear.getMonth() &&
            saleDate.getDate() === sameDayLastYear.getDate()
          )
        })

        // Calculate totals
        const thisYearTotal = thisYearSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        const lastYearTotal = lastYearSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

        dailyComparison.push({
          date: days[(day + 1) % 7], // Adjust to start with Monday
          thisYear: thisYearTotal,
          lastYear: lastYearTotal,
        })
      }

      // Reorder to start with Monday
      const mondayIndex = dailyComparison.findIndex((day) => day.date === "Mon")
      if (mondayIndex > 0) {
        const beforeMonday = dailyComparison.slice(0, mondayIndex)
        const fromMonday = dailyComparison.slice(mondayIndex)
        setDailyData([...fromMonday, ...beforeMonday])
      } else {
        setDailyData(dailyComparison)
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
      // Use mock data as fallback
      setDailyData([
        { date: "Mon", thisYear: 1200, lastYear: 1000 },
        { date: "Tue", thisYear: 1500, lastYear: 1300 },
        { date: "Wed", thisYear: 1800, lastYear: 1600 },
        { date: "Thu", thisYear: 1200, lastYear: 1400 },
        { date: "Fri", thisYear: 2000, lastYear: 1800 },
        { date: "Sat", thisYear: 2500, lastYear: 2200 },
        { date: "Sun", thisYear: 1800, lastYear: 1500 },
      ])
      setWeeklyData([
        { date: "Week 1", thisYear: 8000, lastYear: 7500 },
        { date: "Week 2", thisYear: 9500, lastYear: 8800 },
        { date: "Week 3", thisYear: 8800, lastYear: 9000 },
        { date: "Week 4", thisYear: 10200, lastYear: 9500 },
      ])
      setMonthlyData([
        { date: "Jan", thisYear: 35000, lastYear: 32000 },
        { date: "Feb", thisYear: 38000, lastYear: 35000 },
        { date: "Mar", thisYear: 42000, lastYear: 38000 },
        { date: "Apr", thisYear: 40000, lastYear: 37000 },
        { date: "May", thisYear: 45000, lastYear: 41000 },
        { date: "Jun", thisYear: 48000, lastYear: 43000 },
        { date: "Jul", thisYear: 46000, lastYear: 42000 },
        { date: "Aug", thisYear: 49000, lastYear: 45000 },
        { date: "Sep", thisYear: 51000, lastYear: 47000 },
        { date: "Oct", thisYear: 50000, lastYear: 46000 },
        { date: "Nov", thisYear: 53000, lastYear: 48000 },
        { date: "Dec", thisYear: 55000, lastYear: 50000 },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchSalesData()
  }, [fetchSettings, fetchSalesData])

  // Get data based on selected timeframe
  const getData = () => {
    switch (timeframe) {
      case "daily":
        return dailyData
      case "weekly":
        return weeklyData
      case "monthly":
      default:
        return monthlyData
    }
  }

  // Calculate totals
  const data = getData()
  const totalThisYear = data.reduce((sum, item) => sum + item.thisYear, 0)
  const totalLastYear = data.reduce((sum, item) => sum + item.lastYear, 0)
  const percentageChange = calculateChange(totalThisYear, totalLastYear)

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading sales comparison data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Sales Comparison</h1>
        <p className="text-muted-foreground">Compare sales performance year over year</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalThisYear)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalLastYear)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${percentageChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {percentageChange >= 0 ? "+" : ""}
              {percentageChange.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" onValueChange={setTimeframe} value={timeframe}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                    <Legend />
                    <Bar dataKey="thisYear" name="This Year" fill="#4f46e5" />
                    <Bar dataKey="lastYear" name="Last Year" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyData.map((day, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">{day.date}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">This Year</p>
                      <p className="font-medium">{formatPrice(day.thisYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Year</p>
                      <p className="font-medium">{formatPrice(day.lastYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Change</p>
                      <p
                        className={`font-medium ${
                          calculateChange(day.thisYear, day.lastYear) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {calculateChange(day.thisYear, day.lastYear) >= 0 ? "+" : ""}
                        {calculateChange(day.thisYear, day.lastYear).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                    <Legend />
                    <Bar dataKey="thisYear" name="This Year" fill="#4f46e5" />
                    <Bar dataKey="lastYear" name="Last Year" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyData.map((week, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">{week.date}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">This Year</p>
                      <p className="font-medium">{formatPrice(week.thisYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Year</p>
                      <p className="font-medium">{formatPrice(week.lastYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Change</p>
                      <p
                        className={`font-medium ${
                          calculateChange(week.thisYear, week.lastYear) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {calculateChange(week.thisYear, week.lastYear) >= 0 ? "+" : ""}
                        {calculateChange(week.thisYear, week.lastYear).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                    <Legend />
                    <Bar dataKey="thisYear" name="This Year" fill="#4f46e5" />
                    <Bar dataKey="lastYear" name="Last Year" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monthlyData.map((month, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">{month.date}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">This Year</p>
                      <p className="font-medium">{formatPrice(month.thisYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Year</p>
                      <p className="font-medium">{formatPrice(month.lastYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Change</p>
                      <p
                        className={`font-medium ${
                          calculateChange(month.thisYear, month.lastYear) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {calculateChange(month.thisYear, month.lastYear) >= 0 ? "+" : ""}
                        {calculateChange(month.thisYear, month.lastYear).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

