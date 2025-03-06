// Create a types directory and index file for future use
export interface Product {
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

export interface User {
  id: string
  email: string
  username?: string
  avatar_url?: string
  role?: string
}

export interface Sale {
  id: string
  cashier_id: string
  total: number
  payment_method: string
  status: string
  created_at?: string
  updated_at?: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  price: number
  subtotal: number
  created_at?: string
}

export interface Expense {
  id: string
  amount: number
  description: string
  category: string
  date: string
  created_by: string
  created_at?: string
  updated_at?: string
}

