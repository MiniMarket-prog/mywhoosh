"use client"

import { useState } from "react"
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

// Mock data for income vs expenses
const monthlyData = [
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
]

const weeklyData = [
  { week: "Week 1", income: 12000, expenses: 9000 },
  { week: "Week 2", income: 13500, expenses: 10000 },
  { week: "Week 3", income: 12800, expenses: 9500 },
  { week: "Week 4", income: 14200, expenses: 10500 },
]

const dailyData = [
  { day: "Mon", income: 2200, expenses: 1800 },
  { day: "Tue", income: 2500, expenses: 1900 },
  { day: "Wed", income: 2800, expenses: 2100 },
  { day: "Thu", income: 2300, expenses: 1700 },
  { day: "Fri", income: 3000, expenses: 2200 },
  { day: "Sat", income: 3500, expenses: 2500 },
  { day: "Sun", income: 2800, expenses: 2000 },
]

// Type definitions to fix TypeScript errors
type TimeframeData = {
  [key: string]: string | number
  income: number
  expenses: number
}

type TimeframeType = "daily" | "weekly" | "monthly"

export default function FinancePage() {
  const [timeframe, setTimeframe] = useState<TimeframeType>("monthly")

  // Function to get the appropriate data based on timeframe
  const getData = (): TimeframeData[] => {
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
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
            formatCurrency={formatCurrency}
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
            formatCurrency={formatCurrency}
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
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface FinancialOverviewProps {
  data: TimeframeData[]
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
            <div className="text-2xl font-bold">{formatCurrency(profit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin.toFixed(2)}%</div>
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

