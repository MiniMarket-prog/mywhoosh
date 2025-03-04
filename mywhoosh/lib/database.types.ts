export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          barcode: string
          price: number
          cost_price: number
          stock: number
          category: string
          min_stock: number
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          barcode: string
          price: number
          cost_price: number
          stock: number
          category: string
          min_stock: number
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          barcode?: string
          price?: number
          cost_price?: number
          stock?: number
          category?: string
          min_stock?: number
          image_url?: string | null
        }
      }
      sales: {
        Row: {
          id: string
          created_at: string
          cashier_id: string
          total: number
          payment_method: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          cashier_id: string
          total: number
          payment_method: string
          status: string
        }
        Update: {
          id?: string
          created_at?: string
          cashier_id?: string
          total?: number
          payment_method?: string
          status?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          quantity: number
          price: number
          subtotal: number
        }
        Insert: {
          id?: string
          sale_id: string
          product_id: string
          quantity: number
          price: number
          subtotal: number
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string
          quantity?: number
          price?: number
          subtotal?: number
        }
      }
      expenses: {
        Row: {
          id: string
          created_at: string
          description: string
          amount: number
          category: string
        }
        Insert: {
          id?: string
          created_at?: string
          description: string
          amount: number
          category: string
        }
        Update: {
          id?: string
          created_at?: string
          description?: string
          amount?: number
          category?: string
        }
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          role: string
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          role: string
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          role?: string
        }
      }
    }
  }
}

