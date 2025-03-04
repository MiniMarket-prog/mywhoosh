"use client"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { CalendarIcon, Edit, Plus, Trash } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"

// Define the Expense type to match our database structure
type Expense = {
  id: string
  created_at: string
  description: string
  amount: number
  category: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const { toast } = useToast()
  const { profile } = useAuth()

  // Form states
  const [expenseName, setExpenseName] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("general")
  const [expenseDate, setExpenseDate] = useState<Date>(new Date())

  // Add date range state and predefined range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [predefinedRange, setPredefinedRange] = useState("30days")

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true)

    let query = supabase.from("expenses").select("*").order("created_at", { ascending: false })

    // Add date filtering if not showing all expenses
    if (predefinedRange !== "all" && dateRange?.from && dateRange?.to) {
      const fromDate = dateRange.from.toISOString()
      const toDate = dateRange.to.toISOString()
      query = query.gte("created_at", fromDate).lte("created_at", toDate)
    }

    const { data, error } = await query

    if (error) {
      const errorMessage = error.message || "Failed to fetch expenses"
      console.error("Error fetching expenses:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } else {
      setExpenses(data || [])
    }

    setIsLoading(false)
  }, [dateRange, predefinedRange, toast])

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchExpenses()
    }
  }, [dateRange, fetchExpenses])

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
      case "all":
        from = new Date(0) // Beginning of time
        break
      default:
        from = subDays(today, 30)
    }

    setDateRange({ from, to })
  }

  const handleAddExpense = async () => {
    if (!expenseName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an expense name",
        variant: "destructive",
      })
      return
    }

    if (!expenseAmount || isNaN(Number.parseFloat(expenseAmount)) || Number.parseFloat(expenseAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      const amount = Number.parseFloat(expenseAmount)

      // Create a new expense
      const { error } = await supabase.from("expenses").insert({
        description: expenseName.trim(),
        amount,
        category: expenseCategory,
        created_at: expenseDate.toISOString(),
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense added successfully",
      })

      // Reset form
      setExpenseName("")
      setExpenseAmount("")
      setExpenseCategory("general")
      setExpenseDate(new Date())
      setIsAddDialogOpen(false)

      // Refresh expenses list
      fetchExpenses()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add expense"
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setExpenseName(expense.description)
    setExpenseAmount(expense.amount.toString())
    setExpenseCategory(expense.category)
    setExpenseDate(new Date(expense.created_at))
    setIsEditDialogOpen(true)
  }

  const handleUpdateExpense = async () => {
    if (!selectedExpense) return

    if (!expenseName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an expense name",
        variant: "destructive",
      })
      return
    }

    if (!expenseAmount || isNaN(Number.parseFloat(expenseAmount)) || Number.parseFloat(expenseAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      const amount = Number.parseFloat(expenseAmount)

      // Update the expense
      const { error } = await supabase
        .from("expenses")
        .update({
          description: expenseName.trim(),
          amount,
          category: expenseCategory,
          created_at: expenseDate.toISOString(),
        })
        .eq("id", selectedExpense.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense updated successfully",
      })

      // Reset form
      setExpenseName("")
      setExpenseAmount("")
      setExpenseCategory("general")
      setExpenseDate(new Date())
      setIsEditDialogOpen(false)
      setSelectedExpense(null)

      // Refresh expenses list
      fetchExpenses()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update expense"
      console.error("Error updating expense:", error)
      toast({
        title: "Error",
        description: errorMessage,
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

      // Refresh expenses list
      fetchExpenses()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete expense"
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const resetForm = () => {
    setExpenseName("")
    setExpenseAmount("")
    setExpenseCategory("general")
    setExpenseDate(new Date())
  }

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  // Check if user is admin for conditional rendering
  const isAdmin = profile?.role === "admin"

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
              <SelectItem value="all">All time</SelectItem>
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

          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Enter the details of the expense you want to add.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expense-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="expense-name"
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    className="col-span-3"
                    placeholder="Rent, Utilities, Supplies, etc."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expense-amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="col-span-3"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expense-category" className="text-right">
                    Category
                  </Label>
                  <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                    <SelectTrigger id="expense-category" className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expense-date" className="text-right">
                    Date
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !expenseDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expenseDate ? format(expenseDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expenseDate}
                          onSelect={(date) => date && setExpenseDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>Add Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            {predefinedRange === "all"
              ? "Showing all expenses"
              : dateRange?.from && dateRange?.to
                ? `Expenses from ${format(dateRange.from, "MMM d, yyyy")} to ${format(dateRange.to, "MMM d, yyyy")}`
                : "View all expenses and their details."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : expenses.length > 0 ? (
            <>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Expenses:</span>
                  <span className="font-bold text-lg">{formatCurrency(calculateTotalExpenses())}</span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.created_at)}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="capitalize">{expense.category}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No expenses found</h3>
              <p className="text-muted-foreground">
                {predefinedRange === "all"
                  ? "Add an expense to see it here"
                  : "No expenses found for the selected period"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            resetForm()
            setSelectedExpense(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the details of this expense.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-expense-name"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="edit-expense-amount"
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="col-span-3"
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-category" className="text-right">
                Category
              </Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger id="edit-expense-category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expenseDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expenseDate ? format(expenseDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expenseDate}
                      onSelect={(date) => date && setExpenseDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateExpense}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

