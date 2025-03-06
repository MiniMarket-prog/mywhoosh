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
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { CalendarIcon, Edit, Eye, Trash, ShoppingCart } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { Minus, Plus } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

type Sale = {
  id: string
  created_at: string
  cashier_id: string
  total: number
  payment_method: string
  status: string
  cashier_name?: string
}

type SaleItem = {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  price: number
  subtotal: number
  product_name?: string
  original_quantity?: number
  product?: {
    id: string
    name: string
    barcode: string
    price: number
    stock: number
    category: string
  }
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const { profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItems, setEditingItems] = useState<SaleItem[]>([])

  // Add date range state and predefined range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [predefinedRange, setPredefinedRange] = useState("30days")

  // Fix the useEffect dependency array by adding fetchSales
  const fetchSales = useCallback(async () => {
    setIsLoading(true)

    let query = supabase.from("sales").select("*").order("created_at", { ascending: false })

    // Add date filtering if not showing all sales
    if (predefinedRange !== "all" && dateRange?.from && dateRange?.to) {
      const fromDate = dateRange.from.toISOString()
      const toDate = dateRange.to.toISOString()
      query = query.gte("created_at", fromDate).lte("created_at", toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching sales:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sales",
        variant: "destructive",
      })
    } else {
      // Get cashier names
      const salesWithCashierNames = await Promise.all(
        (data || []).map(async (sale) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("id", sale.cashier_id)
            .single()

          return {
            ...sale,
            cashier_name: profileData?.full_name || profileData?.username || "Unknown",
          }
        }),
      )

      setSales(salesWithCashierNames)
    }

    setIsLoading(false)
  }, [dateRange, predefinedRange, toast])

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchSales()
    }
  }, [dateRange, fetchSales])

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

  const fetchSaleItems = async (saleId: string) => {
    setIsLoadingItems(true)

    const { data, error } = await supabase.from("sale_items").select("*").eq("sale_id", saleId)

    if (error) {
      console.error("Error fetching sale items:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sale items",
        variant: "destructive",
      })
    } else {
      // Get product names
      const itemsWithProductNames = await Promise.all(
        (data || []).map(async (item) => {
          const { data: productData } = await supabase.from("products").select("*").eq("id", item.product_id).single()

          return {
            ...item,
            product_name: productData?.name || "Unknown Product",
            product: productData || undefined,
          }
        }),
      )

      setSaleItems(itemsWithProductNames)
    }

    setIsLoadingItems(false)
  }

  const handleViewSale = async (sale: Sale) => {
    setSelectedSale(sale)
    setIsViewDialogOpen(true)
    await fetchSaleItems(sale.id)
  }

  // Add handleEditSale function after handleViewSale
  const handleEditSale = async (sale: Sale) => {
    setSelectedSale(sale)
    setIsEditDialogOpen(true)

    // Fetch sale items for editing
    setIsLoadingItems(true)
    const { data, error } = await supabase.from("sale_items").select("*").eq("sale_id", sale.id)

    if (error) {
      console.error("Error fetching sale items:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sale items",
        variant: "destructive",
      })
      setIsLoadingItems(false)
      return
    }

    // Get product names and current stock
    const itemsWithDetails = await Promise.all(
      (data || []).map(async (item) => {
        const { data: productData } = await supabase.from("products").select("*").eq("id", item.product_id).single()

        return {
          ...item,
          product_name: productData?.name || "Unknown Product",
          original_quantity: item.quantity, // Store original quantity for stock calculations
          product: productData || undefined,
        }
      }),
    )

    setEditingItems(itemsWithDetails)
    setIsLoadingItems(false)
  }

  // Add updateItemQuantity function
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setEditingItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.price,
            }
          : item,
      ),
    )
  }

  // Add calculateEditedTotal function
  const calculateEditedTotal = () => {
    return editingItems.reduce((total, item) => total + item.subtotal, 0)
  }

  // Add handleDeleteItem function to remove an item from a sale
  const handleDeleteItem = async (itemId: string) => {
    // Find the item to be deleted
    const itemToDelete = editingItems.find((item) => item.id === itemId)

    if (!itemToDelete) return

    // Ask for confirmation
    if (!confirm(`Are you sure you want to remove ${itemToDelete.product_name} from this sale?`)) {
      return
    }

    // Remove the item from the editing items array
    setEditingItems((prevItems) => prevItems.filter((item) => item.id !== itemId))

    toast({
      title: "Item removed",
      description: `${itemToDelete.product_name} has been removed from the sale`,
    })
  }

  // Add handleSaveEdit function
  const handleSaveEdit = async () => {
    if (!selectedSale) return

    try {
      // Get the original items to compare with edited items
      const { data: originalItems, error: originalItemsError } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", selectedSale.id)

      if (originalItemsError) throw originalItemsError

      // Find deleted items (items in originalItems but not in editingItems)
      const deletedItems = originalItems.filter(
        (originalItem) => !editingItems.some((editItem) => editItem.id === originalItem.id),
      )

      // Delete removed items from the database
      for (const item of deletedItems) {
        // Restore stock for deleted items
        const { error: stockError } = await supabase.rpc("increment_stock", {
          product_id: item.product_id,
          quantity: item.quantity,
        })

        if (stockError) throw stockError

        // Delete the item from sale_items
        const { error: deleteError } = await supabase.from("sale_items").delete().eq("id", item.id)

        if (deleteError) throw deleteError
      }

      // Update stock for each product based on quantity changes
      for (const item of editingItems) {
        const originalItem = originalItems.find((i) => i.id === item.id)

        if (originalItem) {
          const quantityDifference = originalItem.quantity - item.quantity

          if (quantityDifference !== 0) {
            // If quantity decreased, increase stock; if increased, decrease stock
            const { error: stockError } = await supabase.rpc("increment_stock", {
              product_id: item.product_id,
              quantity: quantityDifference,
            })

            if (stockError) throw stockError
          }

          // Update sale item
          const { error: updateItemError } = await supabase
            .from("sale_items")
            .update({
              quantity: item.quantity,
              subtotal: item.subtotal,
            })
            .eq("id", item.id)

          if (updateItemError) throw updateItemError
        }
      }

      // Update sale total
      const newTotal = calculateEditedTotal()
      const { error: updateSaleError } = await supabase
        .from("sales")
        .update({ total: newTotal })
        .eq("id", selectedSale.id)

      if (updateSaleError) throw updateSaleError

      toast({
        title: "Sale updated",
        description: "Sale has been updated successfully",
      })

      setIsEditDialogOpen(false)
      fetchSales()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update sale"
      console.error("Error updating sale:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this sale? This will also restore product stock.")) return

    try {
      // Get sale items first to restore stock
      const { data: items, error: itemsError } = await supabase.from("sale_items").select("*").eq("sale_id", saleId)

      if (itemsError) throw itemsError

      // Restore stock for each product
      for (const item of items || []) {
        const { error: stockError } = await supabase.rpc("increment_stock", {
          product_id: item.product_id,
          quantity: item.quantity,
        })

        if (stockError) throw stockError
      }

      // Delete sale items
      const { error: deleteItemsError } = await supabase.from("sale_items").delete().eq("sale_id", saleId)

      if (deleteItemsError) throw deleteItemsError

      // Delete sale
      const { error: deleteSaleError } = await supabase.from("sales").delete().eq("id", saleId)

      if (deleteSaleError) throw deleteSaleError

      toast({
        title: "Sale deleted",
        description: "Sale has been deleted and stock has been restored",
      })

      fetchSales()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete sale"
      console.error("Error deleting sale:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Add function to continue sale in POS with proper typing
  const handleContinueInPOS = async (sale: Sale) => {
    try {
      // Directly fetch and use the items without depending on state
      const { data, error } = await supabase.from("sale_items").select("*").eq("sale_id", sale.id)

      if (error) throw error

      // Get product details for each item
      const itemsWithDetails = await Promise.all(
        (data || []).map(async (item) => {
          const { data: productData } = await supabase.from("products").select("*").eq("id", item.product_id).single()

          return {
            ...item,
            product_name: productData?.name || "Unknown Product",
            product: productData || undefined,
          }
        }),
      )

      // Store the sale data in localStorage to be accessed by the POS page
      const saleData = {
        id: sale.id,
        items: itemsWithDetails.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        payment_method: sale.payment_method,
      }

      localStorage.setItem("continue_sale", JSON.stringify(saleData))

      // Navigate to the POS page
      toast({
        title: "Opening in POS",
        description: "Sale is being loaded in the POS page",
      })

      router.push("/pos")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to continue sale in POS"
      console.error("Error continuing sale in POS:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">View and manage your sales records.</p>
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>
            {predefinedRange === "all"
              ? "Showing all sales transactions"
              : dateRange?.from && dateRange?.to
                ? `Sales from ${format(dateRange.from, "MMM d, yyyy")} to ${format(dateRange.to, "MMM d, yyyy")}`
                : "View all sales transactions and their details."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : sales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.created_at)}</TableCell>
                    <TableCell>{sale.cashier_name}</TableCell>
                    <TableCell className="capitalize">{sale.payment_method}</TableCell>
                    <TableCell className="text-right font-medium">${sale.total.toFixed(2)}</TableCell>
                    {/* Update the actions cell in the table to include Continue in POS button */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewSale(sale)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleContinueInPOS(sale)}
                          title="Continue in POS"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span className="sr-only">Continue in POS</span>
                        </Button>
                        {profile?.role === "admin" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEditSale(sale)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No sales found</h3>
              <p className="text-muted-foreground">
                {predefinedRange === "all"
                  ? "Start selling to see your sales history"
                  : "No sales found for the selected period"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              {selectedSale && (
                <>
                  Sale #{selectedSale.id.substring(0, 8)} - {formatDate(selectedSale.created_at)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSale && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">Cashier</p>
                  <p className="text-sm">{selectedSale.cashier_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm capitalize">{selectedSale.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm capitalize">{selectedSale.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-sm font-bold">${selectedSale.total.toFixed(2)}</p>
                </div>
              </div>
            )}

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingItems ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Loading items...
                      </TableCell>
                    </TableRow>
                  ) : saleItems.length > 0 ? (
                    saleItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">${item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No items found for this sale
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            {/* Add Continue in POS button in the dialog footer */}
            {selectedSale && (
              <Button
                variant="outline"
                onClick={() => {
                  handleContinueInPOS(selectedSale)
                  setIsViewDialogOpen(false)
                }}
                className="mr-auto"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Continue in POS
              </Button>
            )}
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the Edit Dialog after the View Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>
              {selectedSale && (
                <>
                  Sale #{selectedSale.id.substring(0, 8)} - {formatDate(selectedSale.created_at)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSale && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">Cashier</p>
                  <p className="text-sm">{selectedSale.cashier_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm capitalize">{selectedSale.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm capitalize">{selectedSale.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">New Total</p>
                  <p className="text-sm font-bold">${calculateEditedTotal().toFixed(2)}</p>
                </div>
              </div>
            )}

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingItems ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading items...
                      </TableCell>
                    </TableRow>
                  ) : editingItems.length > 0 ? (
                    editingItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">${item.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No items found for this sale
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            {/* Add Continue in POS button in the edit dialog footer */}
            {selectedSale && (
              <Button
                variant="outline"
                onClick={() => {
                  handleContinueInPOS(selectedSale)
                  setIsEditDialogOpen(false)
                }}
                className="mr-auto"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Continue in POS
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

