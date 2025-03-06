"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Barcode,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash,
  X,
  Calculator,
  DollarSign,
  Receipt,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Save,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/contexts/language-context"
import { Sheet, SheetContent } from "@/components/ui/sheet"

type Product = {
  id: string
  name: string
  barcode: string
  price: number
  stock: number
  min_stock: number
  category: string
}

type CartItem = {
  product: Product
  quantity: number
  subtotal: number
}

type ContinueSaleData = {
  id: string
  items: {
    product: Product
    quantity: number
    subtotal: number
  }[]
  payment_method: string
}

type LowStockProduct = Product & {
  newStock?: number
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [isChangeCalculatorOpen, setIsChangeCalculatorOpen] = useState(false)
  const [amountReceived, setAmountReceived] = useState("")
  const [lastCompletedSale, setLastCompletedSale] = useState<{
    id: string
    items: CartItem[]
    total: number
    paymentMethod: string
    date: Date
  } | null>(null)
  const quickAmounts = [5, 10, 20, 50, 100]
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [continuedSaleId, setContinuedSaleId] = useState<string | null>(null)
  const [isContinuedSaleAlertOpen, setIsContinuedSaleAlertOpen] = useState(false)
  const [currency, setCurrency] = useState("MAD")
  const { t } = useLanguage()

  // New state for low stock products
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [isLowStockDialogOpen, setIsLowStockDialogOpen] = useState(false)
  const [isUpdatingStock, setIsUpdatingStock] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Format price with Moroccan Dirham
  const formatPrice = useCallback(
    (price: number) => {
      return formatCurrency(price, currency)
    },
    [currency],
  )

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase.from("products").select("*").gt("stock", 0).order("name")

    if (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } else {
      setProducts(data || [])
      setFilteredProducts(data || [])
    }

    setIsLoading(false)
  }, [toast])

  // New function to fetch low stock products
  const fetchLowStockProducts = useCallback(async () => {
    try {
      // Using a more compatible query format that doesn't rely on supabase.raw
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .lt("stock", supabase.rpc("get_min_stock_for_product", {}))
        .order("name")

      if (error) {
        console.error("Error fetching low stock products:", error)

        // Let's try a fallback approach if the RPC isn't available
        console.log("Trying fallback query for low stock products")
        const { data: fallbackData, error: fallbackError } = await supabase.from("products").select("*").order("name")

        if (fallbackError) {
          console.error("Fallback query error:", fallbackError)
          throw fallbackError
        }

        // Filter the products manually in JavaScript
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
        setLowStockProducts([]) // Reset to empty array on error
      }
    }
  }, [])

  const fetchRecentProducts = useCallback(async () => {
    // Get the 10 most recently sold products
    const { data: saleItems, error } = await supabase
      .from("sale_items")
      .select("product_id")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching recent products:", error)
      return
    }

    if (saleItems && saleItems.length > 0) {
      // Get unique product IDs
      const uniqueProductIds = Array.from(new Set(saleItems.map((item) => item.product_id)))

      // Fetch product details
      const { data: recentProductsData } = await supabase
        .from("products")
        .select("*")
        .in("id", uniqueProductIds)
        .gt("stock", 0)
        .limit(8)

      setRecentProducts(recentProductsData || [])
    }
  }, [])

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

  // Check for continued sale data in localStorage
  useEffect(() => {
    const continueSaleData = localStorage.getItem("continue_sale")

    if (continueSaleData) {
      try {
        const saleData = JSON.parse(continueSaleData) as ContinueSaleData

        // Set the cart with the items from the continued sale
        const cartItems: CartItem[] = saleData.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          subtotal: item.subtotal,
        }))

        setCart(cartItems)
        setPaymentMethod(saleData.payment_method)
        setContinuedSaleId(saleData.id)
        setIsContinuedSaleAlertOpen(true)

        // Clear the localStorage data to prevent reloading on refresh
        localStorage.removeItem("continue_sale")

        toast({
          title: "Sale loaded",
          description: `Continuing sale #${saleData.id.substring(0, 8)}`,
        })
      } catch (error) {
        console.error("Error parsing continued sale data:", error)
        localStorage.removeItem("continue_sale")
      }
    }
  }, [toast])

  useEffect(() => {
    fetchProducts()
    fetchRecentProducts()
    fetchSettings()
    fetchLowStockProducts() // Fetch low stock products on initial load

    // Add this debug log
    console.log("Fetching low stock products")

    // Focus the barcode input on page load
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [fetchProducts, fetchRecentProducts, fetchSettings, fetchLowStockProducts])

  // Add this after your other useEffect hooks
  useEffect(() => {
    // Initial fetch
    fetchLowStockProducts()

    // Refresh every 30 seconds
    const interval = setInterval(fetchLowStockProducts, 30000)

    return () => clearInterval(interval)
  }, [fetchLowStockProducts])

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode.includes(searchTerm),
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  const addToCart = useCallback(
    (product: Product) => {
      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.product.id === product.id)

        if (existingItem) {
          // Check if we have enough stock
          if (existingItem.quantity >= product.stock) {
            toast({
              title: "Stock limit reached",
              description: `Only ${product.stock} items available in stock`,
              variant: "destructive",
            })
            return prevCart
          }

          return prevCart.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.product.price,
                }
              : item,
          )
        }

        // Play a beep sound when adding to cart
        const audio = new Audio("/beep.mp3")
        audio.play().catch((e) => console.log("Audio play failed:", e))

        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            subtotal: product.price,
          },
        ]
      })
    },
    [toast],
  )

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback(
    (productId: string, newQuantity: number) => {
      if (newQuantity < 1) return

      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.product.id === productId) {
            // Check if we have enough stock
            if (newQuantity > item.product.stock) {
              toast({
                title: "Stock limit reached",
                description: `Only ${item.product.stock} items available in stock`,
                variant: "destructive",
              })
              return item
            }

            return {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.product.price,
            }
          }
          return item
        }),
      )
    },
    [toast],
  )

  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.subtotal, 0)
  }, [cart])

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to the cart before checkout",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // If this is a continued sale, update the existing sale
      if (continuedSaleId) {
        // First, get the original sale items to handle stock properly
        const { data: originalItems, error: originalItemsError } = await supabase
          .from("sale_items")
          .select("*")
          .eq("sale_id", continuedSaleId)

        if (originalItemsError) throw originalItemsError

        // Delete all original sale items
        const { error: deleteItemsError } = await supabase.from("sale_items").delete().eq("sale_id", continuedSaleId)

        if (deleteItemsError) throw deleteItemsError

        // Restore stock for all original items
        for (const item of originalItems || []) {
          const { error: stockError } = await supabase.rpc("increment_stock", {
            product_id: item.product_id,
            quantity: item.quantity,
          })

          if (stockError) throw stockError
        }

        // Create new sale items
        const saleItems = cart.map((item) => ({
          sale_id: continuedSaleId,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.subtotal,
        }))

        const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

        if (itemsError) throw itemsError

        // Update the sale total and payment method
        const { error: updateSaleError } = await supabase
          .from("sales")
          .update({
            total: calculateTotal(),
            payment_method: paymentMethod,
            status: "completed",
          })
          .eq("id", continuedSaleId)

        if (updateSaleError) throw updateSaleError

        // Update product stock
        for (const item of cart) {
          const { error: stockError } = await supabase
            .from("products")
            .update({ stock: item.product.stock - item.quantity })
            .eq("id", item.product.id)

          if (stockError) throw stockError
        }

        toast({
          title: "Sale updated",
          description: `Total: ${formatPrice(calculateTotal())}`,
        })

        setLastCompletedSale({
          id: continuedSaleId,
          items: [...cart],
          total: calculateTotal(),
          paymentMethod,
          date: new Date(),
        })

        // Reset continued sale state
        setContinuedSaleId(null)
        setIsContinuedSaleAlertOpen(false)
      } else {
        // First check if we have a valid user profile
        let cashierId = user?.id

        if (!cashierId) {
          // Try to get the first available profile from the database
          const { data: profiles } = await supabase.from("profiles").select("id").limit(1)

          if (profiles && profiles.length > 0) {
            cashierId = profiles[0].id
          } else {
            throw new Error("No valid cashier profile found. Please log in or create a profile first.")
          }
        }

        // Create a new sale record
        const { data: saleData, error: saleError } = await supabase
          .from("sales")
          .insert({
            cashier_id: cashierId,
            total: calculateTotal(),
            payment_method: paymentMethod,
            status: "completed",
          })
          .select()

        if (saleError) throw saleError

        const saleId = saleData[0].id

        // Create sale items
        const saleItems = cart.map((item) => ({
          sale_id: saleId,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.subtotal,
        }))

        const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

        if (itemsError) throw itemsError

        // Update product stock
        for (const item of cart) {
          const { error: stockError } = await supabase
            .from("products")
            .update({ stock: item.product.stock - item.quantity })
            .eq("id", item.product.id)

          if (stockError) throw stockError
        }

        toast({
          title: "Sale completed",
          description: `Total: ${formatPrice(calculateTotal())}`,
        })

        setLastCompletedSale({
          id: saleId,
          items: [...cart],
          total: calculateTotal(),
          paymentMethod,
          date: new Date(),
        })
      }

      // Reset cart
      setCart([])
      setPaymentMethod("cash")

      // Refresh products and recent products
      fetchProducts()
      fetchRecentProducts()
      fetchLowStockProducts() // Refresh low stock products after sale

      // Focus back on barcode input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process sale"
      console.error("Error processing sale:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [
    cart,
    paymentMethod,
    toast,
    user?.id,
    calculateTotal,
    fetchProducts,
    fetchRecentProducts,
    fetchLowStockProducts,
    continuedSaleId,
    formatPrice,
  ])

  // New function to handle stock updates for low stock products
  const handleUpdateStock = async () => {
    setIsUpdatingStock(true)
    try {
      // Filter products that have been updated
      const productsToUpdate = lowStockProducts.filter(
        (product) => product.newStock !== undefined && product.newStock !== product.stock,
      )

      if (productsToUpdate.length === 0) {
        toast({
          title: "No changes",
          description: "No stock changes were made",
        })
        setIsLowStockDialogOpen(false)
        return
      }

      // Update each product's stock
      for (const product of productsToUpdate) {
        const { error } = await supabase.from("products").update({ stock: product.newStock }).eq("id", product.id)

        if (error) throw error
      }

      toast({
        title: "Stock updated",
        description: `Updated stock for ${productsToUpdate.length} products`,
      })

      // Refresh products and low stock products
      fetchProducts()
      fetchLowStockProducts()
      setIsLowStockDialogOpen(false)
    } catch (error) {
      console.error("Error updating stock:", error)
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStock(false)
    }
  }

  const handleQuickAction = (amount: number) => {
    setAmountReceived(amount.toString())
  }

  const calculateChange = () => {
    const received = Number.parseFloat(amountReceived)
    const total = calculateTotal()

    if (isNaN(received) || received < total) {
      return 0
    }

    return received - total
  }

  const handleVoidLastItem = useCallback(() => {
    if (cart.length > 0) {
      const lastItem = cart[cart.length - 1]
      removeFromCart(lastItem.product.id)
      toast({
        title: "Item removed",
        description: `${lastItem.product.name} has been removed from the cart`,
      })
    }
  }, [cart, removeFromCart, toast])

  const handleRepeatLastSale = useCallback(() => {
    if (!lastCompletedSale) {
      toast({
        title: "No previous sale",
        description: "There is no previous sale to repeat",
        variant: "destructive",
      })
      return
    }

    // Add all items from the last sale to the cart
    lastCompletedSale.items.forEach((item) => {
      // Check if we have enough stock first
      const currentProduct = products.find((p) => p.id === item.product.id)
      if (currentProduct && currentProduct.stock >= item.quantity) {
        for (let i = 0; i < item.quantity; i++) {
          addToCart(currentProduct)
        }
      } else {
        toast({
          title: "Stock issue",
          description: `Not enough stock for ${item.product.name}`,
          variant: "destructive",
        })
      }
    })

    setPaymentMethod(lastCompletedSale.paymentMethod)

    toast({
      title: "Sale repeated",
      description: "The previous sale has been added to the cart",
    })
  }, [lastCompletedSale, products, addToCart, toast])

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchTerm) return

    // Try to find product by exact barcode match first
    const product = products.find((p) => p.barcode === searchTerm)

    if (product) {
      addToCart(product)
      setSearchTerm("")
      // Re-focus the input for the next scan
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    } else {
      // If no exact match is found, keep the search term visible
      // This allows the user to see the filtered products by name
      // and select one manually
      toast({
        title: "No exact barcode match",
        description: "Showing products matching your search term",
      })
    }
  }

  // Handle canceling a continued sale
  const handleCancelContinuedSale = () => {
    if (confirm("Are you sure you want to cancel continuing this sale? The cart will be cleared.")) {
      setCart([])
      setContinuedSaleId(null)
      setIsContinuedSaleAlertOpen(false)
      toast({
        title: "Sale canceled",
        description: "The continued sale has been canceled",
      })
    }
  }

  // Handle stock input change for low stock products
  const handleStockInputChange = (productId: string, value: string) => {
    const newValue = Number.parseInt(value, 10)

    if (isNaN(newValue) || newValue < 0) return

    setLowStockProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, newStock: newValue } : product)),
    )
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 to focus barcode input
      if (e.key === "F2") {
        e.preventDefault()
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
        }
      }

      // F3 to open change calculator
      if (e.key === "F3") {
        e.preventDefault()
        setIsChangeCalculatorOpen(true)
      }

      // F4 to process checkout
      if (e.key === "F4" && !isProcessing && cart.length > 0) {
        e.preventDefault()
        handleCheckout()
      }

      // F5 to void last item
      if (e.key === "F5" && cart.length > 0) {
        e.preventDefault()
        handleVoidLastItem()
      }

      // F6 to repeat last sale
      if (e.key === "F6" && lastCompletedSale) {
        e.preventDefault()
        handleRepeatLastSale()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cart, isProcessing, lastCompletedSale, handleCheckout, handleVoidLastItem, handleRepeatLastSale])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Alert for continued sale */}
      {isContinuedSaleAlertOpen && continuedSaleId && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Continuing Sale</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You are continuing sale #{continuedSaleId.substring(0, 8)}</span>
            <Button variant="outline" size="sm" onClick={handleCancelContinuedSale}>
              Cancel
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="lg:w-2/3 space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChangeCalculatorOpen(true)}
            className="flex items-center gap-1"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Change Calculator</span>
            <span className="sm:hidden">Calc</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVoidLastItem}
            disabled={cart.length === 0}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Void Last Item</span>
            <span className="sm:hidden">Void</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRepeatLastSale}
            disabled={!lastCompletedSale}
            className="flex items-center gap-1"
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Repeat Last Sale</span>
            <span className="sm:hidden">Repeat</span>
          </Button>

          {/* New Low Stock Alert Button */}
          <Button
            variant={lowStockProducts.length > 0 ? "destructive" : "outline"}
            size="sm"
            onClick={() => setIsLowStockDialogOpen(true)}
            className="flex items-center gap-1 ml-auto relative"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Low Stock</span>
            {lowStockProducts.length > 0 && (
              <Badge variant="outline" className="ml-1 bg-background text-foreground">
                {lowStockProducts.length}
              </Badge>
            )}
            {lowStockProducts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Button>
        </div>

        <form onSubmit={handleBarcodeSubmit} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Scan barcode or search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              ref={barcodeInputRef}
            />
          </div>
          <Button type="submit" variant="outline" size="icon">
            <Barcode className="h-4 w-4" />
            <span className="sr-only">Scan Barcode</span>
          </Button>
        </form>

        {recentProducts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recently Sold Products</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {recentProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="h-auto py-2 justify-start text-left flex flex-col items-start"
                  onClick={() => addToCart(product)}
                >
                  <span className="font-medium truncate w-full">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{formatPrice(product.price)}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Update the product grid to be more responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-24 bg-muted rounded-md mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm truncate">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 pb-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Stock: {product.stock}
                    {product.stock <= product.min_stock && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">
                        Low
                      </Badge>
                    )}
                  </p>
                  <p className="font-medium">{formatPrice(product.price)}</p>
                </CardContent>
                <CardFooter className="p-2">
                  <Button className="w-full" size="sm" onClick={() => addToCart(product)}>
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground">Try a different search term or scan a barcode</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart section - make it fixed on mobile */}
      <div className="lg:w-1/3">
        <div className="lg:sticky lg:top-4">
          {/* Mobile cart toggle button - only visible on small screens */}
          <div className="fixed bottom-4 right-4 lg:hidden z-10">
            <Button onClick={() => setIsCartOpen(!isCartOpen)} size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>

          {/* Mobile cart sheet */}
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent side="bottom" className="h-[80vh] p-0 sm:max-w-none">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Shopping Cart</h2>
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {/* Cart items */}
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Your cart is empty</h3>
                      <p className="text-muted-foreground">Scan products to begin checkout</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">{formatPrice(item.product.price)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="mobile-payment-method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="mobile-payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={cart.length === 0 || isProcessing}
                    onClick={() => {
                      handleCheckout()
                      setIsCartOpen(false)
                    }}
                  >
                    {isProcessing ? "Processing..." : continuedSaleId ? "Update Sale" : "Checkout"}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop cart - only visible on large screens */}
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{continuedSaleId ? "Continuing Sale" : "Shopping Cart"}</span>
                {cart.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={() => setCart([])}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Your cart is empty</h3>
                  <p />
                  <h3 className="text-lg font-medium">Your cart is empty</h3>
                  <p className="text-muted-foreground">Scan products to begin checkout</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Press <kbd className="px-1 py-0.5 bg-muted rounded">F2</kbd> to focus scanner
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(item.product.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                size="lg"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
              >
                {isProcessing ? "Processing..." : continuedSaleId ? "Update Sale (F4)" : "Checkout (F4)"}
              </Button>
              {lastCompletedSale && (
                <Button variant="outline" className="w-full" size="sm" onClick={() => setIsReceiptDialogOpen(true)}>
                  <Receipt className="mr-2 h-4 w-4" />
                  View Last Receipt
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Scan products with barcode scanner or search by name
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Change Calculator Dialog */}
      <Dialog open={isChangeCalculatorOpen} onOpenChange={setIsChangeCalculatorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Calculator</DialogTitle>
            <DialogDescription>Calculate change for the current transaction.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total-amount">Total Amount</Label>
                <div className="flex items-center mt-1 border rounded-md p-2 bg-muted">
                  <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="amount-received">Amount Received</Label>
                <div className="flex items-center mt-1">
                  <DollarSign className="absolute ml-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount-received"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-8"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {quickAmounts.map((amount) => (
                <Button key={amount} variant="outline" size="sm" onClick={() => handleQuickAction(amount)}>
                  {formatCurrency(amount, currency)}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => handleQuickAction(calculateTotal())}>
                Exact
              </Button>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Change Due:</span>
              <span className="text-2xl font-bold">{formatPrice(calculateChange())}</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsChangeCalculatorOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              {lastCompletedSale && `Sale #${lastCompletedSale.id.substring(0, 8)}`}
            </DialogDescription>
          </DialogHeader>
          {lastCompletedSale && (
            <div className="space-y-4">
              <div className="border-t border-b py-2">
                <p className="text-center font-medium">Mini Market</p>
                <p className="text-center text-sm text-muted-foreground">{lastCompletedSale.date.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                {lastCompletedSale.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span>{item.quantity} x </span>
                      <span>{item.product.name}</span>
                    </div>
                    <span>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(lastCompletedSale.total)}</span>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Payment Method: {lastCompletedSale.paymentMethod}</p>
                <p>Cashier: {user?.email}</p>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-4">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsReceiptDialogOpen(false)}>Close</Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Low Stock Products Dialog */}
      <Dialog open={isLowStockDialogOpen} onOpenChange={setIsLowStockDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Products
            </DialogTitle>
            <DialogDescription>
              {lowStockProducts.length > 0
                ? "The following products are below their minimum stock level. Adjust stock quantities as needed."
                : "All products are above their minimum stock levels."}
            </DialogDescription>
          </DialogHeader>

          {lowStockProducts.length > 0 ? (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>New Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-destructive">{product.stock}</TableCell>
                      <TableCell>{product.min_stock}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={product.newStock !== undefined ? product.newStock : product.stock}
                          onChange={(e) => handleStockInputChange(product.id, e.target.value)}
                          className="w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium">All products have sufficient stock</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no products below their minimum stock level.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLowStockDialogOpen(false)}>
              Cancel
            </Button>
            {lowStockProducts.length > 0 && (
              <Button onClick={handleUpdateStock} disabled={isUpdatingStock}>
                {isUpdatingStock ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Stock
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

