"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Mock data for sales comparison
const dailyData = [
  { date: "Mon", thisYear: 1200, lastYear: 1000 },
  { date: "Tue", thisYear: 1500, lastYear: 1300 },
  { date: "Wed", thisYear: 1800, lastYear: 1600 },
  { date: "Thu", thisYear: 1200, lastYear: 1400 },
  { date: "Fri", thisYear: 2000, lastYear: 1800 },
  { date: "Sat", thisYear: 2500, lastYear: 2200 },
  { date: "Sun", thisYear: 1800, lastYear: 1500 },
]

const weeklyData = [
  { date: "Week 1", thisYear: 8000, lastYear: 7500 },
  { date: "Week 2", thisYear: 9500, lastYear: 8800 },
  { date: "Week 3", thisYear: 8800, lastYear: 9000 },
  { date: "Week 4", thisYear: 10200, lastYear: 9500 },
]

const monthlyData = [
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
]

export default function SalesComparisonPage() {
  const [timeframe, setTimeframe] = useState("monthly")

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

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
            <div className="text-2xl font-bold">{formatCurrency(totalThisYear)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLastYear)}</div>
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
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
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
                      <p className="font-medium">{formatCurrency(day.thisYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Year</p>
                      <p className="font-medium">{formatCurrency(day.lastYear)}</p>
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
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
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
                      <p className="font-medium">{formatCurrency(week.thisYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Year</p>
                      <p className="font-medium">{formatCurrency(week.lastYear)}</p>
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
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
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
                      <p className="font-medium">{formatCurrency(month.thisYear)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Year</p>
                      <p className="font-medium">{formatCurrency(month.lastYear)}</p>
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

