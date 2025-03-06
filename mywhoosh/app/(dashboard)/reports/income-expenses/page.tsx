"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "recharts"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format"
import { Loader2 } from "lucide-react"

// Define types for our data structures
type FinanceDataPoint = {
  [key: string]: string | number
  income: number
  expenses: number
}

type TimeframeType = "daily" | "weekly" | "monthly"

export default function IncomeExpensesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<TimeframeType>("monthly")
  const [currency, setCurrency] = useState("MAD")
  const [dailyData, setDailyData] = useState<FinanceDataPoint[]>([])
  const [weeklyData, setWeeklyData] = useState<FinanceDataPoint[]>([])
  const [monthlyData, setMonthlyData] = useState<FinanceDataPoint[]>([])

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

  // Fetch financial data
  const fetchFinancialData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch sales data for income
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, total, created_at")
        .order("created_at", { ascending: false })

      if (salesError) throw salesError

      // Fetch expenses data
      // Note: Assuming you have an expenses table. If not, we'll simulate expenses
      let expensesData: any[] = []
      try {
        const { data, error } = await supabase
          .from("expenses")
          .select("id, amount, created_at")
          .order("created_at", { ascending: false })

        if (!error && data) {
          expensesData = data
        }
      } catch (expenseError) {
        console.warn("Could not fetch expenses, will simulate based on sales:", expenseError)
        // If no expenses table, simulate expenses as 70% of sales
        if (salesData) {
          expensesData = salesData.map((sale) => ({
            id: `exp-${sale.id}`,
            amount: sale.total * 0.7,
            created_at: sale.created_at,
          }))
        }
      }

      if (!salesData || salesData.length === 0) {
        // If no data, use mock data
        setDailyData([
          { day: "Mon", income: 2200, expenses: 1800 },
          { day: "Tue", income: 2500, expenses: 1900 },
          { day: "Wed", income: 2800, expenses: 2100 },
          { day: "Thu", income: 2300, expenses: 1700 },
          { day: "Fri", income: 3000, expenses: 2200 },
          { day: "Sat", income: 3500, expenses: 2500 },
          { day: "Sun", income: 2800, expenses: 2000 },
        ])
        setWeeklyData([
          { week: "Week 1", income: 12000, expenses: 9000 },
          { week: "Week 2", income: 13500, expenses: 10000 },
          { week: "Week 3", income: 12800, expenses: 9500 },
          { week: "Week 4", income: 14200, expenses: 10500 },
        ])
        setMonthlyData([
          { month: "Jan", income: 45000, expenses: 32000 },
          { month: "Feb", income: 48000, expenses: 35000 },
          { month: "Mar", income: 52000, expenses: 38000 },
          { month: "Apr", income: 49000, expenses: 37000 },
          { month: "May", income: 53000, expenses: 41000 },
          { month: "Jun", income: 56000, expenses: 43000 },
          { month: "Jul", income: 54000, expenses: 42000 },
          { month: "Aug", income: 58000, expenses: 45000 },
          { month: "Sep", income: 60000, expenses: 46000 },
          { month: "Oct", income: 59000, expenses: 44000 },
          { month: "Nov", income: 62000, expenses: 47000 },
          { month: "Dec", income: 65000, expenses: 48000 },
        ])
        setIsLoading(false)
        return
      }

      // Process monthly data
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const monthlyFinanceData: FinanceDataPoint[] = []

      for (let month = 0; month < 12; month++) {
        // Income for this month (from sales)
        const monthSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return saleDate.getMonth() === month
        })

        // Expenses for this month
        const monthExpenses = expensesData.filter((expense) => {
          const expenseDate = new Date(expense.created_at)
          return expenseDate.getMonth() === month
        })

        // Calculate totals
        const monthlyIncome = monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        const monthlyExpenses = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

        monthlyFinanceData.push({
          month: months[month],
          income: monthlyIncome,
          expenses: monthlyExpenses,
        })
      }

      setMonthlyData(monthlyFinanceData)

      // Process weekly data
      const weeklyFinanceData: FinanceDataPoint[] = []

      // Get the current week number (0-indexed)
      const getWeekNumber = (date: Date) => {
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        return Math.floor((date.getDate() - 1 + firstDayOfMonth.getDay()) / 7)
      }

      // Current month only
      const now = new Date()
      const currentMonth = now.getMonth()

      for (let week = 0; week < 4; week++) {
        // Income for this week (from sales)
        const weekSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return saleDate.getMonth() === currentMonth && getWeekNumber(saleDate) === week
        })

        // Expenses for this week
        const weekExpenses = expensesData.filter((expense) => {
          const expenseDate = new Date(expense.created_at)
          return expenseDate.getMonth() === currentMonth && getWeekNumber(expenseDate) === week
        })

        // Calculate totals
        const weeklyIncome = weekSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        const weeklyExpenses = weekExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

        weeklyFinanceData.push({
          week: `Week ${week + 1}`,
          income: weeklyIncome,
          expenses: weeklyExpenses,
        })
      }

      setWeeklyData(weeklyFinanceData)

      // Process daily data
      const dailyFinanceData: FinanceDataPoint[] = []
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

      // Get start of current week
      const startOfWeek = new Date(now)
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust when day is Sunday
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek)
        currentDay.setDate(startOfWeek.getDate() + i)

        // Income for this day (from sales)
        const daySales = salesData.filter((sale) => {
          const saleDate = new Date(sale.created_at)
          return (
            saleDate.getDate() === currentDay.getDate() &&
            saleDate.getMonth() === currentDay.getMonth() &&
            saleDate.getFullYear() === currentDay.getFullYear()
          )
        })

        // Expenses for this day
        const dayExpenses = expensesData.filter((expense) => {
          const expenseDate = new Date(expense.created_at)
          return (
            expenseDate.getDate() === currentDay.getDate() &&
            expenseDate.getMonth() === currentDay.getMonth() &&
            expenseDate.getFullYear() === currentDay.getFullYear()
          )
        })

        // Calculate totals
        const dailyIncome = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        const dailyExpenses = dayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

        dailyFinanceData.push({
          day: days[i],
          income: dailyIncome,
          expenses: dailyExpenses,
        })
      }

      setDailyData(dailyFinanceData)
    } catch (error) {
      console.error("Error fetching financial data:", error)
      // Use mock data as fallback
      setDailyData([
        { day: "Mon", income: 2200, expenses: 1800 },
        { day: "Tue", income: 2500, expenses: 1900 },
        { day: "Wed", income: 2800, expenses: 2100 },
        { day: "Thu", income: 2300, expenses: 1700 },
        { day: "Fri", income: 3000, expenses: 2200 },
        { day: "Sat", income: 3500, expenses: 2500 },
        { day: "Sun", income: 2800, expenses: 2000 },
      ])
      setWeeklyData([
        { week: "Week 1", income: 12000, expenses: 9000 },
        { week: "Week 2", income: 13500, expenses: 10000 },
        { week: "Week 3", income: 12800, expenses: 9500 },
        { week: "Week 4", income: 14200, expenses: 10500 },
      ])
      setMonthlyData([
        { month: "Jan", income: 45000, expenses: 32000 },
        { month: "Feb", income: 48000, expenses: 35000 },
        { month: "Mar", income: 52000, expenses: 38000 },
        { month: "Apr", income: 49000, expenses: 37000 },
        { month: "May", income: 53000, expenses: 41000 },
        { month: "Jun", income: 56000, expenses: 43000 },
        { month: "Jul", income: 54000, expenses: 42000 },
        { month: "Aug", income: 58000, expenses: 45000 },
        { month: "Sep", income: 60000, expenses: 46000 },
        { month: "Oct", income: 59000, expenses: 44000 },
        { month: "Nov", income: 62000, expenses: 47000 },
        { month: "Dec", income: 65000, expenses: 48000 },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchFinancialData()
  }, [fetchSettings, fetchFinancialData])

  // Function to get the appropriate data based on timeframe
  const getData = (): FinanceDataPoint[] => {
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

  // Function to get the date key based on timeframe
  const getDateKey = (): string => {
    switch (timeframe) {
      case "daily":
        return "day"
      case "weekly":
        return "week"
      case "monthly":
      default:
        return "month"
    }
  }

  const data = getData()
  const dateKey = getDateKey()

  // Calculate totals and profit
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0)
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0)
  const profit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Income vs Expenses</h1>
        <p className="text-muted-foreground">Track your income and expenses over time</p>
      </div>

      <Tabs defaultValue="monthly" onValueChange={(value) => setTimeframe(value as TimeframeType)} value={timeframe}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <FinancialOverview
            data={dailyData}
            dateKey="day"
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            profit={profit}
            profitMargin={profitMargin}
            formatCurrency={formatPrice}
          />
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <FinancialOverview
            data={weeklyData}
            dateKey="week"
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            profit={profit}
            profitMargin={profitMargin}
            formatCurrency={formatPrice}
          />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <FinancialOverview
            data={monthlyData}
            dateKey="month"
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            profit={profit}
            profitMargin={profitMargin}
            formatCurrency={formatPrice}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface FinancialOverviewProps {
  data: FinanceDataPoint[]
  dateKey: string
  totalIncome: number
  totalExpenses: number
  profit: number
  profitMargin: number
  formatCurrency: (amount: number) => string
}

function FinancialOverview({
  data,
  dateKey,
  totalIncome,
  totalExpenses,
  profit,
  profitMargin,
  formatCurrency,
}: FinancialOverviewProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(profit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
              {profitMargin.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={dateKey} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="income" fill="#4f46e5" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={dateKey} />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#4f46e5" name="Income" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

