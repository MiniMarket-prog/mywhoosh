import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Goal } from "@/types"

interface GoalCardProps {
  goal: Goal
}

const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const progressPercentage = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)

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

  const getProgressColor = (percentage: number) => {
    if (percentage < 25) return "bg-red-500"
    if (percentage < 50) return "bg-orange-500"
    if (percentage < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <Card className="overflow-hidden">
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
              <p className="font-medium">{formatCurrency(goal.current_amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Target</p>
              <p className="font-medium">{formatCurrency(goal.target_amount)}</p>
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
}

export default GoalCard

