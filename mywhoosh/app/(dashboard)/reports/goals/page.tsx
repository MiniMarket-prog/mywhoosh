"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for goals
const mockGoals = [
  {
    id: "1",
    name: "Increase Monthly Sales",
    target_amount: 50000,
    current_amount: 35000,
    start_date: "2023-01-01",
    end_date: "2023-12-31",
    category: "sales",
    type: "revenue",
  },
  {
    id: "2",
    name: "Reduce Operating Costs",
    target_amount: 20000,
    current_amount: 8000,
    start_date: "2023-01-01",
    end_date: "2023-12-31",
    category: "expenses",
    type: "cost",
  },
  {
    id: "3",
    name: "Increase Profit Margin",
    target_amount: 30,
    current_amount: 22,
    start_date: "2023-01-01",
    end_date: "2023-12-31",
    category: "profit",
    type: "percentage",
  },
  {
    id: "4",
    name: "New Customer Acquisition",
    target_amount: 500,
    current_amount: 320,
    start_date: "2023-01-01",
    end_date: "2023-12-31",
    category: "customers",
    type: "count",
  },
]

export default function GoalsPage() {
  const [goals] = useState(mockGoals)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 25) return "bg-red-500"
    if (percentage < 50) return "bg-orange-500"
    if (percentage < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const formatValue = (value: number, type: string) => {
    if (type === "percentage") return `${value}%`
    if (type === "count") return value.toString()
    return formatCurrency(value)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Financial Goals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progressPercentage = getProgressPercentage(goal.current_amount, goal.target_amount)

          return (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle>{goal.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getProgressColor(progressPercentage)}`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-medium">{formatValue(goal.current_amount, goal.type)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-medium">{formatValue(goal.target_amount, goal.type)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">{formatDate(goal.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">{formatDate(goal.end_date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium capitalize">{goal.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{goal.type}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {goals.length === 0 && <div className="text-gray-500 mt-4">No goals yet. Let's create some!</div>}
    </div>
  )
}

