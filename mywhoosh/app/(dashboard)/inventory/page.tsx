"use client"

import type React from "react"

// Add this type declaration at the top of the file, before the component
declare global {
  interface Window {
    JsBarcode: any
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
import { Barcode, Edit, PlusCircle, Trash, Printer, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Script from "next/script"

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

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
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

  useEffect(() => {
    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchProducts()
  }, [profile, router])

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === "") {
      setFilteredProducts(products)
    } else {
      const searchTermLower = searchTerm.toLowerCase()
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTermLower) ||
          product.barcode.toLowerCase().includes(searchTermLower),
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  useEffect(() => {
    // Generate barcode when dialog is open and library is loaded
    if (isPrintDialogOpen && selectedProduct && barcodeLoaded) {
      // Add a small delay to ensure the SVG element is in the DOM
      const timer = setTimeout(() => {
        try {
          window.JsBarcode("#barcode", selectedProduct.barcode, {
            format: "CODE128", // Change format to CODE128 which is more flexible
            lineColor: "#000",
            width: 2,
            height: 100,
            displayValue: true, // Show the barcode number
            fontSize: 12,
            margin: 10,
            background: "#ffffff",
          })
        } catch (error) {
          console.error("Error generating barcode:", error)
          toast({
            title: "Error",
            description: "Failed to generate barcode",
            variant: "destructive",
          })
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isPrintDialogOpen, selectedProduct, barcodeLoaded, toast])

  const fetchProducts = async () => {
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
  }

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
    } catch (error: any) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
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
    } catch (error: any) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
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
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
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

    const printContents = printRef.current.innerHTML
    const originalContents = document.body.innerHTML

    document.body.innerHTML = printContents
    window.print()
    document.body.innerHTML = originalContents

    // Reload the page to restore React functionality
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <Script
        src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"
        onLoad={() => setBarcodeLoaded(true)}
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

      {/* Add search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by product name or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

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
          ) : (
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
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">No products found</p>
                        <p className="text-sm text-muted-foreground">
                          Try a different search term or clear the search to see all products
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Barcode Label</DialogTitle>
            <DialogDescription>Preview and print the barcode label for {selectedProduct?.name}</DialogDescription>
          </DialogHeader>

          <div ref={printRef} className="p-4 border rounded-md">
            <div className="flex flex-col items-center space-y-2 print:p-0">
              {/* Product Name */}
              <div className="text-center font-bold">{selectedProduct?.name}</div>

              {/* Add this right after the Product Name div */}
              {!barcodeLoaded && <div className="h-20 w-64 animate-pulse bg-muted rounded"></div>}

              {/* Barcode SVG */}
              <div className="flex justify-center bg-white p-4 w-full">
                <svg id="barcode"></svg>
              </div>

              {/* Price */}
              <div className="text-lg font-bold">${selectedProduct?.price.toFixed(2)}</div>

              {/* Date */}
              <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</div>
            </div>
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

