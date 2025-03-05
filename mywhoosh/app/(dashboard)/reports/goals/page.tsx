"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format"
import { Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Define the Goal type
type Goal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  start_date: string
  end_date: string
  category: string
  type: string
}

// Mock data for fallback
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
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currency, setCurrency] = useState("MAD")

  // Format currency with the selected currency
  const formatPrice = useCallback(
    (price: number, type: string) => {
      if (type === "percentage") return `${price}%`
      if (type === "count") return price.toString()
      return formatCurrency(price, currency)
    },
    [currency],
  )

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

  // Fetch goals data
  const fetchGoals = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch goals from the financial_goals table
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching goals:", error)
        throw error
      }

      if (data && data.length > 0) {
        setGoals(data)
      } else {
        // If no data, use mock data
        console.log("No goals found in database, using mock data")
        setGoals(mockGoals)
      }
    } catch (error) {
      console.error("Error fetching goals:", error)
      // Use mock data as fallback
      setGoals(mockGoals)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchGoals()
  }, [fetchSettings, fetchGoals])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading financial goals...</p>
        </div>
      </div>
    )
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
                  <Progress value={progressPercentage} indicatorClassName={getProgressColor(progressPercentage)} />

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-medium">{formatPrice(goal.current_amount, goal.type)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-medium">{formatPrice(goal.target_amount, goal.type)}</p>
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

