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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { AlertTriangle } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

type LowStockProduct = {
  id: string
  name: string
  stock: number
  min_stock: number
  category: string
  newStock?: number
}

export default function AlertsPage() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<LowStockProduct | null>(null)
  const [newStock, setNewStock] = useState(0)
  const { toast } = useToast()

  // Improved function to fetch low stock products
  const fetchLowStockProducts = useCallback(async () => {
    setIsLoading(true)

    try {
      // Try using the RPC function first
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .lt("stock", supabase.rpc("get_min_stock_for_product", {}))
        .order("name")

      if (error) {
        console.error("Error fetching low stock products:", error)

        // Fallback: fetch all products and filter client-side
        console.log("Trying fallback query for low stock products")
        const { data: fallbackData, error: fallbackError } = await supabase.from("products").select("*").order("name")

        if (fallbackError) {
          console.error("Fallback query error:", fallbackError)
          throw fallbackError
        }

        // Filter products where stock is less than min_stock
        const lowStock = fallbackData?.filter((product) => product.stock < product.min_stock) || []
        console.log("Low stock products (fallback):", lowStock)
        setLowStockProducts(lowStock)
        return
      }

      console.log("Low stock products found:", data) // Debug log
      setLowStockProducts(data || [])
    } catch (error) {
      console.error("Error fetching low stock products:", error)

      // As a last resort, try to get all products and filter client-side
      try {
        const { data } = await supabase.from("products").select("*")
        const lowStock = data?.filter((product) => product.stock < product.min_stock) || []
        console.log("Low stock products (client-side):", lowStock)
        setLowStockProducts(lowStock)
      } catch (err) {
        console.error("Failed to fetch products for client-side filtering:", err)
        toast({
          title: "Error",
          description: "Failed to fetch low stock products",
          variant: "destructive",
        })
        setLowStockProducts([]) // Reset to empty array on error
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchLowStockProducts()
  }, [fetchLowStockProducts])

  const handleAdjustStock = async () => {
    if (!selectedProduct) return

    try {
      const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", selectedProduct.id)

      if (error) throw error

      toast({
        title: "Stock updated",
        description: `${selectedProduct.name} stock updated to ${newStock}`,
      })

      setIsAdjustDialogOpen(false)
      fetchLowStockProducts()
    } catch (error: any) {
      console.error("Error updating stock:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">Monitor low stock products and other important alerts.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Low Stock Products</CardTitle>
            <CardDescription>Products that have fallen below their minimum stock level.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLowStockProducts}
            disabled={isLoading}
            className="mt-2 sm:mt-0"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3 mb-3 sm:mb-0">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-1" />
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Current stock: <span className="font-medium text-destructive">{product.stock}</span> (Minimum:{" "}
                        {product.min_stock})
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">Category: {product.category}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProduct(product)
                      setNewStock(product.stock)
                      setIsAdjustDialogOpen(true)
                    }}
                    className="self-end sm:self-auto"
                  >
                    Adjust Stock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-green-50 text-green-700 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">No low stock alerts</h3>
              <p className="text-muted-foreground">All products are above their minimum stock levels</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Update the stock level for {selectedProduct?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-stock">Current Stock</Label>
              <Input id="current-stock" value={selectedProduct?.stock} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min-stock">Minimum Stock</Label>
              <Input id="min-stock" value={selectedProduct?.min_stock} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-stock">New Stock</Label>
              <Input
                id="new-stock"
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(Number.parseInt(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>Update Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

