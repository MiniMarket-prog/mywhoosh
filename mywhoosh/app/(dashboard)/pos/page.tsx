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

type Product = {
  id: string
  name: string
  barcode: string
  price: number
  stock: number
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

  // Format price with Moroccan Dirham
  const formatPrice = useCallback(
    (price: number) => {
      return formatCurrency(price, currency)
    },
    [currency],
  )

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)

    try {
      console.log("Fetching products...")
      const { data, error } = await supabase.from("products").select("*").gt("stock", 0).order("name")

      if (error) {
        console.error("Error fetching products:", error, JSON.stringify(error))
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive",
        })
        setProducts([])
        setFilteredProducts([])
      } else {
        console.log(`Fetched ${data?.length || 0} products`)
        setProducts(data || [])
        setFilteredProducts(data || [])
      }
    } catch (err) {
      console.error("Exception in fetchProducts:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchRecentProducts = useCallback(async () => {
    try {
      // First check if we have an authenticated session
      const { data: session } = await supabase.auth.getSession()
      console.log("Session check:", session?.session ? "Authenticated" : "Not authenticated")

      // Get the most recent sale items without relying on created_at
      console.log("Fetching recent sale items...")
      const { data: saleItems, error } = await supabase
        .from("sale_items")
        .select("product_id")
        .order("id", { ascending: false }) // Using id instead of created_at
        .limit(20)

      if (error) {
        console.error("Error fetching recent products:", error, JSON.stringify(error))
        setRecentProducts([])
        return
      }

      if (!saleItems || saleItems.length === 0) {
        console.log("No sale items found")
        setRecentProducts([])
        return
      }

      console.log(`Found ${saleItems.length} sale items`)

      // Get unique product IDs
      const uniqueProductIds = Array.from(new Set(saleItems.map((item) => item.product_id)))
      console.log(`Found ${uniqueProductIds.length} unique product IDs`)

      if (uniqueProductIds.length === 0) {
        setRecentProducts([])
        return
      }

      // Fetch product details
      console.log("Fetching product details...")
      const { data: recentProductsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", uniqueProductIds)
        .gt("stock", 0)
        .limit(8)

      if (productsError) {
        console.error("Error fetching product details:", productsError, JSON.stringify(productsError))
        setRecentProducts([])
        return
      }

      console.log(`Fetched ${recentProductsData?.length || 0} recent products`)
      setRecentProducts(recentProductsData || [])
    } catch (err) {
      console.error("Exception in fetchRecentProducts:", err)
      setRecentProducts([])
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      console.log("Fetching settings...")
      const response = await fetch("/api/settings")

      if (!response.ok) {
        console.error("Settings API returned status:", response.status)
        setCurrency("MAD") // Default
        return
      }

      const data = await response.json()

      if (data.settings && data.settings.general && data.settings.general.currency) {
        console.log("Setting currency to:", data.settings.general.currency)
        setCurrency(data.settings.general.currency)
      } else {
        console.log("No currency found in settings, using default")
        setCurrency("MAD")
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
        console.log("Found continued sale data in localStorage")
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
    console.log("POS page mounted, initializing...")
    fetchProducts()
    fetchRecentProducts()
    fetchSettings()

    // Focus the barcode input on page load
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [fetchProducts, fetchRecentProducts, fetchSettings])

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
        console.log(`Updating continued sale: ${continuedSaleId}`)

        // First, get the original sale items to handle stock properly
        const { data: originalItems, error: originalItemsError } = await supabase
          .from("sale_items")
          .select("*")
          .eq("sale_id", continuedSaleId)

        if (originalItemsError) {
          console.error("Error fetching original sale items:", originalItemsError)
          throw originalItemsError
        }

        console.log(`Found ${originalItems?.length || 0} original sale items`)

        // Delete all original sale items
        const { error: deleteItemsError } = await supabase.from("sale_items").delete().eq("sale_id", continuedSaleId)

        if (deleteItemsError) {
          console.error("Error deleting original sale items:", deleteItemsError)
          throw deleteItemsError
        }

        // Restore stock for all original items
        for (const item of originalItems || []) {
          const { error: stockError } = await supabase.rpc("increment_stock", {
            product_id: item.product_id,
            quantity: item.quantity,
          })

          if (stockError) {
            console.error("Error restoring stock:", stockError)
            throw stockError
          }
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

        if (itemsError) {
          console.error("Error inserting new sale items:", itemsError)
          throw itemsError
        }

        // Update the sale total and payment method
        const { error: updateSaleError } = await supabase
          .from("sales")
          .update({
            total: calculateTotal(),
            payment_method: paymentMethod,
            status: "completed",
          })
          .eq("id", continuedSaleId)

        if (updateSaleError) {
          console.error("Error updating sale:", updateSaleError)
          throw updateSaleError
        }

        // Update product stock
        for (const item of cart) {
          const { error: stockError } = await supabase
            .from("products")
            .update({ stock: item.product.stock - item.quantity })
            .eq("id", item.product.id)

          if (stockError) {
            console.error("Error updating product stock:", stockError)
            throw stockError
          }
        }

        console.log("Sale updated successfully")
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
          console.log("No user ID found, looking for a default profile")
          // Try to get the first available profile from the database
          const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id").limit(1)

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError)
            throw profilesError
          }

          if (profiles && profiles.length > 0) {
            cashierId = profiles[0].id
            console.log(`Using default cashier ID: ${cashierId}`)
          } else {
            throw new Error("No valid cashier profile found. Please log in or create a profile first.")
          }
        }

        console.log("Creating new sale...")
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

        if (saleError) {
          console.error("Error creating sale:", saleError)
          throw saleError
        }

        const saleId = saleData[0].id
        console.log(`Sale created with ID: ${saleId}`)

        // Create sale items
        const saleItems = cart.map((item) => ({
          sale_id: saleId,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.subtotal,
        }))

        console.log(`Creating ${saleItems.length} sale items`)
        const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

        if (itemsError) {
          console.error("Error creating sale items:", itemsError)
          throw itemsError
        }

        // Update product stock
        console.log("Updating product stock...")
        for (const item of cart) {
          const { error: stockError } = await supabase
            .from("products")
            .update({ stock: item.product.stock - item.quantity })
            .eq("id", item.product.id)

          if (stockError) {
            console.error(`Error updating stock for product ${item.product.id}:`, stockError)
            throw stockError
          }
        }

        console.log("Sale completed successfully")
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
    continuedSaleId,
    formatPrice,
  ])

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChangeCalculatorOpen(true)}
            className="flex items-center gap-1"
          >
            <Calculator className="h-4 w-4" />
            <span>Change Calculator (F3)</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVoidLastItem}
            disabled={cart.length === 0}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Void Last Item (F5)</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRepeatLastSale}
            disabled={!lastCompletedSale}
            className="flex items-center gap-1"
          >
            <Receipt className="h-4 w-4" />
            <span>Repeat Last Sale (F6)</span>
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

      <div className="lg:w-1/3">
        <Card className="sticky top-4">
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
            <Button className="w-full" size="lg" disabled={cart.length === 0 || isProcessing} onClick={handleCheckout}>
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
    </div>
  )
}

