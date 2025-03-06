"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for charts
const dailyData = [
  { date: "Mon", sales: 1200, lastYear: 1000 },
  { date: "Tue", sales: 1500, lastYear: 1300 },
  { date: "Wed", sales: 1800, lastYear: 1600 },
  { date: "Thu", sales: 1200, lastYear: 1400 },
  { date: "Fri", sales: 2000, lastYear: 1800 },
  { date: "Sat", sales: 2500, lastYear: 2200 },
  { date: "Sun", sales: 1800, lastYear: 1500 },
]

const weeklyData = [
  { date: "Week 1", sales: 8000, lastYear: 7500 },
  { date: "Week 2", sales: 9500, lastYear: 8800 },
  { date: "Week 3", sales: 8800, lastYear: 9000 },
  { date: "Week 4", sales: 10200, lastYear: 9500 },
]

const monthlyData = [
  { date: "Jan", sales: 35000, lastYear: 32000 },
  { date: "Feb", sales: 38000, lastYear: 35000 },
  { date: "Mar", sales: 42000, lastYear: 38000 },
  { date: "Apr", sales: 40000, lastYear: 37000 },
  { date: "May", sales: 45000, lastYear: 41000 },
  { date: "Jun", sales: 48000, lastYear: 43000 },
]

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState("daily")

  // Simple chart rendering function
  const renderChart = (data: any[]) => {
    return (
      <div className="w-full h-[400px] flex flex-col">
        <div className="flex justify-between mb-2">
          <div>Date</div>
          <div className="flex gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              <span>This Year</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>Last Year</span>
            </div>
          </div>
        </div>
        <div className="flex-1 border-t border-l">
          <div className="relative h-full">
            {data.map((item, index) => (
              <div
                key={index}
                className="absolute bottom-0 flex"
                style={{ left: `${(index / data.length) * 100}%`, width: `${100 / data.length}%` }}
              >
                <div className="flex flex-col items-center w-full">
                  <div className="w-4 bg-blue-500" style={{ height: `${(item.sales / 50000) * 100}%` }}></div>
                  <div className="w-4 bg-green-500 ml-1" style={{ height: `${(item.lastYear / 50000) * 100}%` }}></div>
                  <div className="text-xs mt-1">{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" onValueChange={setTimeframe} value={timeframe}>
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
              <div className="text-center p-4">Simple chart visualization (daily data)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailyData.map((day, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="font-medium">{day.date}</div>
                    <div className="flex justify-between mt-2">
                      <div>
                        <div className="text-sm text-gray-500">This Year</div>
                        <div className="font-bold">${day.sales}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Last Year</div>
                        <div className="font-bold">${day.lastYear}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Difference</div>
                        <div className={`font-bold ${day.sales > day.lastYear ? "text-green-500" : "text-red-500"}`}>
                          {day.sales > day.lastYear ? "+" : ""}
                          {day.sales - day.lastYear}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4">Simple chart visualization (weekly data)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyData.map((week, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="font-medium">{week.date}</div>
                    <div className="flex justify-between mt-2">
                      <div>
                        <div className="text-sm text-gray-500">This Year</div>
                        <div className="font-bold">${week.sales}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Last Year</div>
                        <div className="font-bold">${week.lastYear}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Difference</div>
                        <div className={`font-bold ${week.sales > week.lastYear ? "text-green-500" : "text-red-500"}`}>
                          {week.sales > week.lastYear ? "+" : ""}
                          {week.sales - week.lastYear}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4">Simple chart visualization (monthly data)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyData.map((month, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="font-medium">{month.date}</div>
                    <div className="flex justify-between mt-2">
                      <div>
                        <div className="text-sm text-gray-500">This Year</div>
                        <div className="font-bold">${month.sales}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Last Year</div>
                        <div className="font-bold">${month.lastYear}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Difference</div>
                        <div
                          className={`font-bold ${month.sales > month.lastYear ? "text-green-500" : "text-red-500"}`}
                        >
                          {month.sales > month.lastYear ? "+" : ""}
                          {month.sales - month.lastYear}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

