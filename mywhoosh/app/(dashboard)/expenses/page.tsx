"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { CalendarIcon, Edit, PlusCircle, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Expense = {
  id: string
  created_at: string
  description: string
  amount: number
  category: string
}

const EXPENSE_CATEGORIES = ["utilities", "rent", "salary", "inventory", "maintenance", "marketing", "office", "other"]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "other",
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [predefinedRange, setPredefinedRange] = useState("30days")
  const [statistics, setStatistics] = useState({
    total: 0,
    byCategory: {} as Record<string, number>,
  })

  const { profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    if (dateRange?.from && dateRange?.to) {
      fetchExpenses()
    }
  }, [profile, router, dateRange])

  const handlePredefinedRangeChange = (value: string) => {
    setPredefinedRange(value)

    const today = new Date()
    let from: Date
    let to: Date = today

    switch (value) {
      case "7days":
        from = subDays(today, 7)
        break
      case "30days":
        from = subDays(today, 30)
        break
      case "thisMonth":
        from = startOfMonth(today)
        break
      case "lastMonth":
        to = endOfMonth(subDays(startOfMonth(today), 1))
        from = startOfMonth(to)
        break
      case "thisYear":
        from = startOfYear(today)
        break
      default:
        from = subDays(today, 30)
    }

    setDateRange({ from, to })
  }

  const fetchExpenses = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    setIsLoading(true)

    try {
      const fromDate = dateRange.from.toISOString()
      const toDate = dateRange.to.toISOString()

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("created_at", fromDate)
        .lte("created_at", toDate)
        .order("created_at", { ascending: false })

      if (error) throw error

      setExpenses(data || [])

      // Calculate statistics
      const total = (data || []).reduce((sum, expense) => sum + expense.amount, 0)
      const byCategory = (data || []).reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        },
        {} as Record<string, number>,
      )

      setStatistics({ total, byCategory })
    } catch (error: any) {
      console.error("Error fetching expenses:", error)
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("expenses").insert({
        description: newExpense.description,
        amount: Number(newExpense.amount),
        category: newExpense.category,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense added successfully",
      })

      setIsAddDialogOpen(false)
      setNewExpense({
        description: "",
        amount: "",
        category: "other",
      })

      fetchExpenses()
    } catch (error: any) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingExpense) return

    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          description: editingExpense.description,
          amount: editingExpense.amount,
          category: editingExpense.category,
        })
        .eq("id", editingExpense.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense updated successfully",
      })

      setIsEditDialogOpen(false)
      setEditingExpense(null)

      fetchExpenses()
    } catch (error: any) {
      console.error("Error updating expense:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })

      fetchExpenses()
    } catch (error: any) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your business expenses.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={predefinedRange} onValueChange={handlePredefinedRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
              <SelectItem value="thisYear">This year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {predefinedRange === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal w-[240px]", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddExpense}>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>Add a new expense to track your business costs.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Expense</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${statistics.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                : "Select a date range"}
            </p>
          </CardContent>
        </Card>

        {/* Top 3 expense categories */}
        {Object.entries(statistics.byCategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category, amount]) => (
            <Card key={category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${amount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {((amount / statistics.total) * 100).toFixed(1)}% of total expenses
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>View and manage your expense records.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="capitalize">{expense.category}</TableCell>
                    <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingExpense(expense)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No expenses found</h3>
              <p className="text-muted-foreground">
                {predefinedRange === "all"
                  ? "Add your first expense to start tracking"
                  : "No expenses found for the selected period"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          {editingExpense && (
            <form onSubmit={handleEditExpense}>
              <DialogHeader>
                <DialogTitle>Edit Expense</DialogTitle>
                <DialogDescription>Update expense details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingExpense.description}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingExpense.category}
                    onValueChange={(value) => setEditingExpense({ ...editingExpense, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

