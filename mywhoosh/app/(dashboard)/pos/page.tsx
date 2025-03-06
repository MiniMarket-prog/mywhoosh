"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  AlertTriangle,
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
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Product = {
  id: string
  name: string
  barcode: string
  price: number
  stock: number
  category: string
  min_stock: number // Add this property (not optional)
}

type CartItem = {
  product: Product
  quantity: number
  subtotal: number
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
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isChangeCalculatorOpen, setIsChangeCalculatorOpen] = useState(false)
  const [amountReceived, setAmountReceived] = useState("")
  const [lastCompletedSale, setLastCompletedSale] = useState<{
    id: string
    items: CartItem[]
    total: number
    paymentMethod: string
    date: Date
  } | null>(null)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [quickAmounts, setQuickAmounts] = useState<number[]>([5, 10, 20, 50, 100])
  const [isPendingSaleLoaded, setIsPendingSaleLoaded] = useState(false)
  // Add a state to track if we're editing an existing sale
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null)
  // Add this new state for low stock products after the other state declarations
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [isLowStockDialogOpen, setIsLowStockDialogOpen] = useState(false)
  const [isStockAdjustmentDialogOpen, setIsStockAdjustmentDialogOpen] = useState(false)
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [newStockAmount, setNewStockAmount] = useState("")

  const handleCheckoutRef = useRef<() => void>(() => {})
  const handleVoidLastItemRef = useRef<() => void>(() => {})
  const handleRepeatLastSaleRef = useRef<() => void>(() => {})

  useEffect(() => {
    fetchProducts()
    fetchRecentProducts()
    fetchLowStockProducts() // Add this line

    // Focus the barcode input on page load
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [])

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

  const fetchProducts = async () => {
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
  }

  const fetchRecentProducts = async () => {
    try {
      // First get recent sales that have a created_at column
      const { data: recentSales, error: salesError } = await supabase
        .from("sales")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(20)

      if (salesError) throw salesError

      if (!recentSales || recentSales.length === 0) {
        return
      }

      // Get sale items from these recent sales
      const { data: saleItems, error: itemsError } = await supabase
        .from("sale_items")
        .select("product_id")
        .in(
          "sale_id",
          recentSales.map((sale) => sale.id),
        )
        .limit(20)

      if (itemsError) throw itemsError

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
    } catch (error) {
      console.error("Error fetching recent products:", error)
    }
  }

  const fetchLowStockProducts = async () => {
    try {
      // First get all products
      const { data, error } = await supabase.from("products").select("*").order("stock")

      if (error) throw error

      // Then filter in JavaScript where stock < min_stock
      const lowStock = data?.filter((product) => product.stock < product.min_stock) || []
      setLowStockProducts(lowStock)
    } catch (error) {
      console.error("Error fetching low stock products:", error)
    }
  }

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

  const addToCart = (product: Product) => {
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
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
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
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0)
  }

  const handleCheckout = async () => {
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
      let saleId: string

      if (editingSaleId) {
        // We're updating an existing sale

        // First, get the original sale items to handle stock adjustments
        const { data: originalItems } = await supabase.from("sale_items").select("*").eq("sale_id", editingSaleId)

        if (originalItems) {
          // Restore stock for all original items
          for (const item of originalItems) {
            await supabase.rpc("increment_stock", {
              product_id: item.product_id,
              quantity: item.quantity,
            })
          }

          // Delete all original sale items
          await supabase.from("sale_items").delete().eq("sale_id", editingSaleId)
        }

        // Update the sale record
        await supabase
          .from("sales")
          .update({
            total: calculateTotal(),
            payment_method: paymentMethod,
            status: "completed",
          })
          .eq("id", editingSaleId)

        saleId = editingSaleId
      } else {
        // Create a new sale record
        const { data: saleData, error: saleError } = await supabase
          .from("sales")
          .insert({
            cashier_id: user?.id || "",
            total: calculateTotal(),
            payment_method: paymentMethod,
            status: "completed",
          })
          .select()

        if (saleError) throw saleError
        saleId = saleData[0].id
      }

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
        title: editingSaleId ? "Sale updated" : "Sale completed",
        description: `Total: $${calculateTotal().toFixed(2)}`,
      })

      setLastCompletedSale({
        id: saleId,
        items: [...cart],
        total: calculateTotal(),
        paymentMethod,
        date: new Date(),
      })

      // Reset cart and editing state
      setCart([])
      setPaymentMethod("cash")
      setEditingSaleId(null)

      // Refresh products and recent products
      fetchProducts()
      fetchRecentProducts()

      // Focus back on barcode input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    } catch (error: any) {
      console.error("Error processing sale:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process sale",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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

  const handleVoidLastItem = () => {
    if (cart.length > 0) {
      const lastItem = cart[cart.length - 1]
      removeFromCart(lastItem.product.id)
      toast({
        title: "Item removed",
        description: `${lastItem.product.name} has been removed from the cart`,
      })
    }
  }

  const handleRepeatLastSale = () => {
    if (!lastCompletedSale) {
      toast({
        title: "No previous sale",
        description: "There is no previous sale to repeat",
        variant: "destructive",
      })
      return
    }

    // Add all items from the last sale to the cart at once
    setCart((prevCart) => {
      const newCart = [...prevCart]

      lastCompletedSale.items.forEach((item) => {
        const currentProduct = products.find((p) => p.id === item.product.id)
        if (currentProduct && currentProduct.stock >= item.quantity) {
          const existingItemIndex = newCart.findIndex((cartItem) => cartItem.product.id === currentProduct.id)

          if (existingItemIndex >= 0) {
            newCart[existingItemIndex] = {
              ...newCart[existingItemIndex],
              quantity: newCart[existingItemIndex].quantity + item.quantity,
              subtotal: (newCart[existingItemIndex].quantity + item.quantity) * currentProduct.price,
            }
          } else {
            newCart.push({
              product: currentProduct,
              quantity: item.quantity,
              subtotal: item.quantity * currentProduct.price,
            })
          }
        } else {
          toast({
            title: "Stock issue",
            description: `Not enough stock for ${currentProduct?.name || "product"}`,
            variant: "destructive",
          })
        }
      })

      return newCart
    })

    setPaymentMethod(lastCompletedSale.paymentMethod)

    toast({
      title: "Sale repeated",
      description: "The previous sale has been added to the cart",
    })
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
        handleCheckoutRef.current()
      }

      // F5 to void last item
      if (e.key === "F5" && cart.length > 0) {
        e.preventDefault()
        handleVoidLastItemRef.current()
      }

      // F6 to repeat last sale
      if (e.key === "F6" && lastCompletedSale) {
        e.preventDefault()
        handleRepeatLastSaleRef.current()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    cart,
    isProcessing,
    lastCompletedSale,
    products,
    isPendingSaleLoaded,
    toast,
    user,
    paymentMethod,
    calculateTotal,
    fetchProducts,
    fetchRecentProducts,
    isPendingSaleLoaded,
    toast,
  ])

  useEffect(() => {
    const pendingSaleData = localStorage.getItem("pendingSale")
    let isLoading = false // Add loading flag

    if (pendingSaleData && !isPendingSaleLoaded && !isLoading) {
      const loadPendingSale = async () => {
        isLoading = true // Set loading flag
        try {
          const pendingSale = JSON.parse(pendingSaleData)

          // Store the sale ID if we're editing an existing sale
          if (pendingSale.id) {
            setEditingSaleId(pendingSale.id)
          }

          // Get all product details at once
          const { data: productsData } = await supabase
            .from("products")
            .select("*")
            .in(
              "id",
              pendingSale.items.map((item: { product_id: string }) => item.product_id),
            )

          if (!productsData) {
            throw new Error("Failed to fetch products")
          }

          // Create a map of products for easier lookup
          const productsMap = new Map(productsData.map((product) => [product.id, product]))

          // Build the cart items
          const newCart: CartItem[] = []

          pendingSale.items.forEach((item: { product_id: string; quantity: number }) => {
            const product = productsMap.get(item.product_id)
            if (product) {
              newCart.push({
                product,
                quantity: item.quantity,
                subtotal: item.quantity * product.price,
              })
            }
          })

          // Update cart and payment method in a single batch
          setCart(newCart)
          if (pendingSale.payment_method) {
            setPaymentMethod(pendingSale.payment_method)
          }

          // Clear the pending sale from localStorage
          localStorage.removeItem("pendingSale")

          // Show success toast
          toast({
            title: "Sale loaded",
            description: "The selected sale has been loaded into the cart",
          })
        } catch (error) {
          console.error("Error loading pending sale:", error)
          localStorage.removeItem("pendingSale")
          toast({
            title: "Error",
            description: "Failed to load the sale",
            variant: "destructive",
          })
        } finally {
          setIsPendingSaleLoaded(true)
          isLoading = false // Reset loading flag
        }
      }

      loadPendingSale()
    }

    // Cleanup function
    return () => {
      localStorage.removeItem("pendingSale")
    }
  }, [])

  const handleStockAdjustment = async () => {
    if (!adjustingProduct || !newStockAmount) return

    try {
      const { error } = await supabase
        .from("products")
        .update({ stock: Number(newStockAmount) })
        .eq("id", adjustingProduct.id)

      if (error) throw error

      toast({
        title: "Stock updated",
        description: `${adjustingProduct.name} stock updated to ${newStockAmount}`,
      })

      // Refresh products and low stock products
      fetchProducts()
      fetchLowStockProducts()
      setIsStockAdjustmentDialogOpen(false)
      setAdjustingProduct(null)
      setNewStockAmount("")
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
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-2/3 space-y-6">
        {/* Search form moved to top */}
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

        {/* Action buttons below search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangeCalculatorOpen(true)}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Change Calculator (F3)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVoidLastItem}
              disabled={cart.length === 0}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Void Last Item (F5)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRepeatLastSale}
              disabled={!lastCompletedSale}
              className="flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              Repeat Last Sale (F6)
            </Button>
          </div>

          {lowStockProducts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLowStockDialogOpen(true)}
              className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alert
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                {lowStockProducts.length}
              </span>
            </Button>
          )}
        </div>

        {/* Rest of the content remains the same */}
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
                  <span className="text-xs text-muted-foreground">${product.price.toFixed(2)}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <p className="text-xs text-muted-foreground mb-1">Stock: {product.stock}</p>
                  <p className="font-medium">${product.price.toFixed(2)}</p>
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

      <div className="lg:w-1/3">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Shopping Cart</span>
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
                      <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)} each</p>
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
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
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
            <Button className="w-full" size="lg" disabled={cart.length === 0 || isProcessing} onClick={handleCheckout}>
              {isProcessing ? "Processing..." : "Checkout (F4)"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Scan products with barcode scanner or search by name
            </p>
          </CardFooter>
        </Card>
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
                  <span>{calculateTotal().toFixed(2)}</span>
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
                  ${amount}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => handleQuickAction(calculateTotal())}>
                Exact
              </Button>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Change Due:</span>
              <span className="text-2xl font-bold">${calculateChange().toFixed(2)}</span>
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
                    <span>${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${lastCompletedSale.total.toFixed(2)}</span>
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

      {/* Low Stock Dialog */}
      <Dialog open={isLowStockDialogOpen} onOpenChange={setIsLowStockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Low Stock Products
            </DialogTitle>
            <DialogDescription>
              The following products are running low on stock and need to be replenished.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <div className="space-y-3 py-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: <span className="text-red-600 font-medium">{product.stock}</span>
                      {product.min_stock && <span> (Min: {product.min_stock})</span>}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAdjustingProduct(product)
                      setNewStockAmount(product.stock.toString())
                      setIsStockAdjustmentDialogOpen(true)
                    }}
                  >
                    Adjust Stock
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLowStockDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockAdjustmentDialogOpen} onOpenChange={setIsStockAdjustmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Update stock level for {adjustingProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-stock">Current Stock</Label>
              <Input id="current-stock" value={adjustingProduct?.stock} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-stock">New Stock</Label>
              <Input
                id="new-stock"
                type="number"
                min="0"
                value={newStockAmount}
                onChange={(e) => setNewStockAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockAdjustmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockAdjustment}>Update Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

