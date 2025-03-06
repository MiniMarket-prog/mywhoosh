"use client"

import { useEffect, useState, useCallback } from "react"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

// Define the Product type directly in this file
interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  min_stock: number
  category: string
  barcode: string
  created_at?: string
  updated_at?: string
}

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const router = useRouter()

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } else {
      setProducts(data || [])
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Define columns inside the component to have access to fetchProducts
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "price",
      header: "Price",
    },
    {
      accessorKey: "stock",
      header: "Stock",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original

        const handleDeleteProduct = async (id: string) => {
          if (!confirm("Are you sure you want to delete this product?")) return

          try {
            // First check if the product is used in any sales
            const { data: saleItems, error: checkError } = await supabase
              .from("sale_items")
              .select("id")
              .eq("product_id", id)
              .limit(1)

            if (checkError) throw checkError

            // If product is used in sales, show an error message
            if (saleItems && saleItems.length > 0) {
              toast({
                title: "Cannot Delete Product",
                description:
                  "This product has been used in sales and cannot be deleted. Consider marking it as inactive or out of stock instead.",
                variant: "destructive",
              })
              return
            }

            // If not used in sales, proceed with deletion
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

        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/${product.id}`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase())),
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => router.push("/inventory/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="mt-4">
        <Input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default InventoryPage

