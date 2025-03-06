"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/format"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data structure
interface ComparisonData {
  name: string
  thisMonth: number
  lastMonth: number
  difference: number
  percentChange: number
}

export default function ComparisonPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [salesData, setSalesData] = useState<ComparisonData[]>([])
  const [expensesData, setExpensesData] = useState<ComparisonData[]>([])
  const { t, dir } = useLanguage()

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        // In a real app, you would fetch data from your database
        // For now, we'll use sample data
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Sample sales data
        const sampleSalesData: ComparisonData[] = [
          {
            name: "Week 1",
            thisMonth: 4000,
            lastMonth: 3000,
            difference: 1000,
            percentChange: 33.33,
          },
          {
            name: "Week 2",
            thisMonth: 3000,
            lastMonth: 2000,
            difference: 1000,
            percentChange: 50,
          },
          {
            name: "Week 3",
            thisMonth: 2000,
            lastMonth: 2780,
            difference: -780,
            percentChange: -28.06,
          },
          {
            name: "Week 4",
            thisMonth: 2780,
            lastMonth: 1890,
            difference: 890,
            percentChange: 47.09,
          },
        ]

        // Sample expenses data
        const sampleExpensesData: ComparisonData[] = [
          {
            name: "Week 1",
            thisMonth: 1500,
            lastMonth: 1200,
            difference: 300,
            percentChange: 25,
          },
          {
            name: "Week 2",
            thisMonth: 1300,
            lastMonth: 1400,
            difference: -100,
            percentChange: -7.14,
          },
          {
            name: "Week 3",
            thisMonth: 1200,
            lastMonth: 1100,
            difference: 100,
            percentChange: 9.09,
          },
          {
            name: "Week 4",
            thisMonth: 1400,
            lastMonth: 1300,
            difference: 100,
            percentChange: 7.69,
          },
        ]

        setSalesData(sampleSalesData)
        setExpensesData(sampleExpensesData)
      } catch (error) {
        console.error("Error fetching comparison data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchComparisonData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("comparison.report")}</h1>
        <p className="text-muted-foreground">{t("comparison.description")}</p>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">{t("sales")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("expenses")}</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("sales.comparison")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ChartContainer
                  config={{
                    thisMonth: {
                      label: t("this.month"),
                      color: "hsl(var(--chart-1))",
                    },
                    lastMonth: {
                      label: t("last.month"),
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="thisMonth" fill="var(--color-thisMonth)" name={t("this.month")} />
                      <Bar dataKey="lastMonth" fill="var(--color-lastMonth)" name={t("last.month")} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {salesData.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("this.month")}</p>
                      <p className="text-2xl font-bold">{formatCurrency(item.thisMonth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("last.month")}</p>
                      <p className="text-2xl font-bold">{formatCurrency(item.lastMonth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("difference")}</p>
                      <p className={`text-2xl font-bold ${item.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(item.difference)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("percent.change")}</p>
                      <p
                        className={`text-2xl font-bold ${item.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {item.percentChange.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("expenses.comparison")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ChartContainer
                  config={{
                    thisMonth: {
                      label: t("this.month"),
                      color: "hsl(var(--chart-3))",
                    },
                    lastMonth: {
                      label: t("last.month"),
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={expensesData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="thisMonth" fill="var(--color-thisMonth)" name={t("this.month")} />
                      <Bar dataKey="lastMonth" fill="var(--color-lastMonth)" name={t("last.month")} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {expensesData.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("this.month")}</p>
                      <p className="text-2xl font-bold">{formatCurrency(item.thisMonth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("last.month")}</p>
                      <p className="text-2xl font-bold">{formatCurrency(item.lastMonth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("difference")}</p>
                      <p className={`text-2xl font-bold ${item.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(item.difference)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("percent.change")}</p>
                      <p
                        className={`text-2xl font-bold ${item.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {item.percentChange.toFixed(2)}%
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

