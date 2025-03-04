"use client"

import type React from "react"

// Add this type declaration at the top of the file, before the component
declare global {
  interface Window {
    JsBarcode: (
      selector: string,
      data: string,
      options?: {
        format?: string
        lineColor?: string
        width?: number
        height?: number
        displayValue?: boolean
        fontSize?: number
        margin?: number
        background?: string
        text?: string
        font?: string
        textAlign?: string
        textPosition?: string
        textMargin?: number
        fontOptions?: string
      },
    ) => void
  }
}

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
import { Barcode, Edit, PlusCircle, Trash, Printer, Layout, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import Script from "next/script"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Product = {
  id: string
  name: string
  barcode: string
  price: number
  cost_price: number
  stock: number
  category: string
  min_stock: number
}

type LabelTemplate = {
  id: string
  name: string
  description: string
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("standard")
  const [newProduct, setNewProduct] = useState({
    name: "",
    barcode: "",
    price: 0,
    cost_price: 0,
    stock: 0,
    category: "general",
    min_stock: 10,
  })
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [barcodeLoaded, setBarcodeLoaded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Define label templates
  const labelTemplates: LabelTemplate[] = [
    {
      id: "standard",
      name: "Standard",
      description: "Simple vertical layout with product name, barcode, price and date",
    },
    {
      id: "compact",
      name: "Compact",
      description: "Horizontal layout with smaller barcode, ideal for small labels",
    },
    {
      id: "detailed",
      name: "Detailed",
      description: "Includes product category and stock information",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Just the barcode and price",
    },
  ]

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase.from("products").select("*").order("name")

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

  useEffect(() => {
    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchProducts()
  }, [profile, router, fetchProducts])

  // Add search functionality
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

  useEffect(() => {
    // Only attempt to generate barcode when dialog is open, product is selected, and library is loaded
    if (isPrintDialogOpen && selectedProduct && barcodeLoaded && window.JsBarcode) {
      // Use setTimeout to ensure the DOM has been updated and the element exists
      setTimeout(() => {
        try {
          const barcodeElement = document.getElementById("barcode")
          if (!barcodeElement) {
            console.error("Barcode element not found in DOM")
            return
          }

          // Different barcode configurations based on template
          const barcodeConfig = {
            standard: {
              format: "CODE128",
              lineColor: "#000",
              width: 2,
              height: 100,
              displayValue: true,
              fontSize: 12,
              margin: 10,
              background: "#ffffff",
            },
            compact: {
              format: "CODE128",
              lineColor: "#000",
              width: 1.5,
              height: 50,
              displayValue: true,
              fontSize: 10,
              margin: 5,
              background: "#ffffff",
            },
            detailed: {
              format: "CODE128",
              lineColor: "#000",
              width: 2,
              height: 80,
              displayValue: true,
              fontSize: 12,
              margin: 10,
              background: "#ffffff",
            },
            minimal: {
              format: "CODE128",
              lineColor: "#000",
              width: 2,
              height: 60,
              displayValue: false,
              margin: 5,
              background: "#ffffff",
            },
          }

          window.JsBarcode(
            "#barcode",
            selectedProduct.barcode,
            barcodeConfig[selectedTemplate as keyof typeof barcodeConfig],
          )
        } catch (error) {
          console.error("Error generating barcode:", error)
          toast({
            title: "Error",
            description: "Failed to generate barcode",
            variant: "destructive",
          })
        }
      }, 100) // Small delay to ensure DOM is ready
    }
  }, [isPrintDialogOpen, selectedProduct, barcodeLoaded, selectedTemplate, toast])

  const generateBarcode = () => {
    // Generate a random 13-digit EAN barcode
    const prefix = "200" // Example prefix
    const randomDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("")
    const barcode = prefix + randomDigits

    // Calculate check digit (simplified)
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10

    return barcode + checkDigit
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const productToAdd = {
        ...newProduct,
        barcode: newProduct.barcode || generateBarcode(),
      }

      const { error } = await supabase.from("products").insert(productToAdd)

      if (error) throw error

      toast({
        title: "Success",
        description: "Product added successfully",
      })

      setIsAddDialogOpen(false)
      setNewProduct({
        name: "",
        barcode: "",
        price: 0,
        cost_price: 0,
        stock: 0,
        category: "general",
        min_stock: 10,
      })

      fetchProducts()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingProduct) return

    try {
      const { error } = await supabase.from("products").update(editingProduct).eq("id", editingProduct.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      setIsEditDialogOpen(false)
      setEditingProduct(null)

      fetchProducts()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      fetchProducts()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handlePrintBarcode = (product: Product) => {
    setSelectedProduct(product)
    setIsPrintDialogOpen(true)
  }

  const printBarcode = () => {
    if (!printRef.current) return

    // Open a new window/tab
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your popup blocker settings.",
        variant: "destructive",
      })
      return
    }

    // Get the print content
    const printContents = printRef.current.innerHTML

    // Write to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${selectedProduct?.name || "Product"}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            @media print {
              body {
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <div>${printContents}</div>
          <button onclick="window.print()" style="margin-top: 20px; padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print
          </button>
          <script>
            // Re-render the barcode in the new window
            window.onload = function() {
              try {
                JsBarcode("#barcode", "${selectedProduct?.barcode || ""}", ${JSON.stringify({
                  format: "CODE128",
                  lineColor: "#000",
                  width: 2,
                  height: selectedTemplate === "compact" ? 50 : selectedTemplate === "minimal" ? 60 : 100,
                  displayValue: selectedTemplate !== "minimal",
                  fontSize: 12,
                  margin: 10,
                  background: "#ffffff",
                })});
                // Auto-print on load (optional, uncomment if desired)
                // window.print();
              } catch(e) {
                console.error("Error rendering barcode in print window:", e);
              }
            };
          </script>
        </body>
      </html>
    `)

    // Finish writing and focus the new window
    printWindow.document.close()
    printWindow.focus()
  }

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Focus back on the search input after submission
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Render different label templates
  const renderLabelTemplate = () => {
    if (!selectedProduct) return null

    switch (selectedTemplate) {
      case "standard":
        return (
          <div className="flex flex-col items-center space-y-4 print:p-0">
            {/* Product Name */}
            <div className="text-center font-bold text-lg">{selectedProduct.name}</div>

            {/* Barcode SVG */}
            <div className="flex justify-center bg-white p-4 w-full">
              <svg id="barcode"></svg>
            </div>

            {/* Price */}
            <div className="text-xl font-bold">${selectedProduct.price.toFixed(2)}</div>

            {/* Date */}
            <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</div>
          </div>
        )

      case "compact":
        return (
          <div className="flex items-center justify-between p-2 print:p-0">
            <div className="flex flex-col">
              <div className="font-bold">{selectedProduct.name}</div>
              <div className="text-lg font-bold">${selectedProduct.price.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</div>
            </div>
            <div className="bg-white p-2">
              <svg id="barcode"></svg>
            </div>
          </div>
        )

      case "detailed":
        return (
          <div className="flex flex-col space-y-3 print:p-0">
            <div className="text-center font-bold text-lg">{selectedProduct.name}</div>

            <div className="flex justify-center bg-white p-3 w-full">
              <svg id="barcode"></svg>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="font-semibold">Price:</div>
                <div className="text-lg font-bold">${selectedProduct.price.toFixed(2)}</div>
              </div>
              <div>
                <div className="font-semibold">Category:</div>
                <div className="capitalize">{selectedProduct.category}</div>
              </div>
              <div>
                <div className="font-semibold">Stock:</div>
                <div>{selectedProduct.stock} units</div>
              </div>
              <div>
                <div className="font-semibold">Date:</div>
                <div>{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )

      case "minimal":
        return (
          <div className="flex flex-col items-center space-y-2 print:p-0">
            <div className="flex justify-center bg-white p-2 w-full">
              <svg id="barcode"></svg>
            </div>
            <div className="text-lg font-bold">${selectedProduct.price.toFixed(2)}</div>
            <div className="text-xs">{selectedProduct.barcode}</div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Script
        src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"
        onLoad={() => {
          setBarcodeLoaded(true)
          // Don't try to generate barcode here, let the useEffect handle it
        }}
        strategy="afterInteractive"
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddProduct}>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Add a new product to your inventory.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="barcode">Barcode (Optional)</Label>
                    <div className="flex">
                      <Input
                        id="barcode"
                        value={newProduct.barcode}
                        onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                        className="rounded-r-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none"
                        onClick={() => setNewProduct({ ...newProduct, barcode: generateBarcode() })}
                      >
                        <Barcode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="drinks">Drinks</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="household">Household</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Selling Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cost_price">Cost Price</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProduct.cost_price}
                      onChange={(e) => setNewProduct({ ...newProduct, cost_price: Number.parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Initial Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: Number.parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="min_stock">Minimum Stock</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      min="0"
                      value={newProduct.min_stock}
                      onChange={(e) => setNewProduct({ ...newProduct, min_stock: Number.parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add search form */}
      <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by product name or barcode..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            ref={searchInputRef}
          />
        </div>
        <Button type="submit" variant="outline" size="icon">
          <Barcode className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your inventory, prices, and stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.barcode}</TableCell>
                    <TableCell className="capitalize">{product.category}</TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${product.cost_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{product.stock}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(product)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePrintBarcode(product)}>
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Print Barcode</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? (
                  <>
                    No products matching &quot;{searchTerm}&quot;
                    <Button variant="link" onClick={() => setSearchTerm("")} className="ml-2">
                      Clear search
                    </Button>
                  </>
                ) : (
                  "Add products to your inventory to see them here"
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          {editingProduct && (
            <form onSubmit={handleEditProduct}>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>Update product details and stock levels.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-barcode">Barcode</Label>
                    <Input
                      id="edit-barcode"
                      value={editingProduct.barcode}
                      onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={editingProduct.category}
                      onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                    >
                      <SelectTrigger id="edit-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="drinks">Drinks</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="household">Household</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Selling Price</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: Number.parseFloat(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-cost-price">Cost Price</Label>
                    <Input
                      id="edit-cost-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingProduct.cost_price}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, cost_price: Number.parseFloat(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-stock">Stock</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      min="0"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number.parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-min-stock">Minimum Stock</Label>
                    <Input
                      id="edit-min-stock"
                      type="number"
                      min="0"
                      value={editingProduct.min_stock}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, min_stock: Number.parseInt(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Product</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Print Barcode Label</DialogTitle>
            <DialogDescription>Preview and print the barcode label for {selectedProduct?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="template-select">Label Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template-select" className="w-[200px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {labelTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="templates">Template Gallery</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <div ref={printRef} className="p-4 border rounded-md">
                  {!barcodeLoaded ? (
                    <div className="h-40 w-full animate-pulse bg-muted rounded flex items-center justify-center">
                      <p className="text-muted-foreground">Loading barcode generator...</p>
                    </div>
                  ) : (
                    renderLabelTemplate()
                  )}
                </div>
              </TabsContent>
              <TabsContent value="templates">
                <div className="grid grid-cols-2 gap-4">
                  {labelTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-md cursor-pointer hover:border-primary transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={printBarcode}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

