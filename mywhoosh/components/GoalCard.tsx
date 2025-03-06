import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Goal } from "@/types"

interface GoalCardProps {
  goal: Goal
}

export function GoalCard({ goal }: GoalCardProps) {
  // Calculate progress percentage
  const progressPercentage = Math.min(Math.round((goal.current / goal.target) * 100), 100)

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{goal.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{formatCurrency(goal.current)}</span>
            <span className="text-muted-foreground">{formatCurrency(goal.target)}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercentage}% complete</span>
            <span>{new Date(goal.end_date).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

