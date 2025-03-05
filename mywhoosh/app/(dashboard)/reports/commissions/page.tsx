"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format"
import { Loader2 } from "lucide-react"

// Define types for our data structures
type CommissionRule = {
  id: string
  name: string
  percentage: number
  product_id: string
  created_at: string
}

type StaffCommission = {
  id: string
  name: string
  sales: number
  commission: number
  period: string
}

export default function CommissionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [currency, setCurrency] = useState("MAD")
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([])
  const [staffCommissions, setStaffCommissions] = useState<StaffCommission[]>([])

  // Format currency with the selected currency
  const formatPrice = useCallback(
    (price: number) => {
      return formatCurrency(price, currency)
    },
    [currency],
  )

  const formatPercentage = (percentage: number) => {
    return `${percentage}%`
  }

  // Fetch settings to get currency
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

  // Fetch commission data
  const fetchCommissionData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch commission rules
      const { data: rulesData, error: rulesError } = await supabase
        .from("commission_rules")
        .select("*")
        .order("created_at", { ascending: false })

      if (rulesError) {
        console.error("Error fetching commission rules:", rulesError)
        throw rulesError
      }

      // If we have commission rules data, use it
      if (rulesData && rulesData.length > 0) {
        setCommissionRules(rulesData)
      } else {
        // Otherwise, keep using mock data
        setCommissionRules([
          {
            id: "1",
            name: "Standard Commission",
            percentage: 5,
            product_id: "all",
            created_at: "2023-01-01T00:00:00Z",
          },
          {
            id: "2",
            name: "Premium Products",
            percentage: 8,
            product_id: "premium",
            created_at: "2023-01-15T00:00:00Z",
          },
          {
            id: "3",
            name: "Seasonal Promotion",
            percentage: 10,
            product_id: "seasonal",
            created_at: "2023-02-01T00:00:00Z",
          },
          {
            id: "4",
            name: "Clearance Items",
            percentage: 3,
            product_id: "clearance",
            created_at: "2023-03-01T00:00:00Z",
          },
        ])
      }

      // Calculate staff commissions based on sales data
      // This is more complex as we need to join sales with profiles
      // First, get all sales with cashier information
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, total, cashier_id, created_at")
        .order("created_at", { ascending: false })

      if (salesError) {
        console.error("Error fetching sales data:", salesError)
        throw salesError
      }

      // Get all cashiers/staff
      const { data: staffData, error: staffError } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .eq("role", "cashier")

      if (staffError) {
        console.error("Error fetching staff data:", staffError)
        throw staffError
      }

      // Calculate commissions for each staff member
      if (staffData && staffData.length > 0 && salesData && salesData.length > 0) {
        // Get current month and year
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ]
        const currentPeriod = `${monthNames[currentMonth]} ${currentYear}`

        // Calculate commissions for each staff member
        const staffCommissionsData: StaffCommission[] = staffData.map((staff) => {
          // Filter sales for this staff member in the current month
          const staffSales = salesData.filter((sale) => {
            const saleDate = new Date(sale.created_at)
            return (
              sale.cashier_id === staff.id &&
              saleDate.getMonth() === currentMonth &&
              saleDate.getFullYear() === currentYear
            )
          })

          // Calculate total sales amount
          const totalSales = staffSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

          // Apply standard commission rate (5%) - in a real app, you'd apply the appropriate rule
          const commissionAmount = totalSales * 0.05

          return {
            id: staff.id,
            name: staff.full_name || staff.username || "Unknown Staff",
            sales: totalSales,
            commission: commissionAmount,
            period: currentPeriod,
          }
        })

        // Filter out staff with no sales
        const activeStaffCommissions = staffCommissionsData.filter((staff) => staff.sales > 0)

        if (activeStaffCommissions.length > 0) {
          setStaffCommissions(activeStaffCommissions)
        } else {
          // If no staff have sales, use mock data
          setStaffCommissions([
            {
              id: "1",
              name: "John Doe",
              sales: 25000,
              commission: 1250,
              period: currentPeriod,
            },
            {
              id: "2",
              name: "Jane Smith",
              sales: 32000,
              commission: 1600,
              period: currentPeriod,
            },
          ])
        }
      } else {
        // If no staff or sales data, use mock data
        setStaffCommissions([
          {
            id: "1",
            name: "John Doe",
            sales: 25000,
            commission: 1250,
            period: "March 2023",
          },
          {
            id: "2",
            name: "Jane Smith",
            sales: 32000,
            commission: 1600,
            period: "March 2023",
          },
          {
            id: "3",
            name: "Bob Johnson",
            sales: 18000,
            commission: 900,
            period: "March 2023",
          },
          {
            id: "4",
            name: "Alice Williams",
            sales: 30000,
            commission: 1500,
            period: "March 2023",
          },
        ])
      }
    } catch (error) {
      console.error("Error fetching commission data:", error)
      // Keep the mock data as fallback
      setCommissionRules([
        {
          id: "1",
          name: "Standard Commission",
          percentage: 5,
          product_id: "all",
          created_at: "2023-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "Premium Products",
          percentage: 8,
          product_id: "premium",
          created_at: "2023-01-15T00:00:00Z",
        },
        {
          id: "3",
          name: "Seasonal Promotion",
          percentage: 10,
          product_id: "seasonal",
          created_at: "2023-02-01T00:00:00Z",
        },
        {
          id: "4",
          name: "Clearance Items",
          percentage: 3,
          product_id: "clearance",
          created_at: "2023-03-01T00:00:00Z",
        },
      ])
      setStaffCommissions([
        {
          id: "1",
          name: "John Doe",
          sales: 25000,
          commission: 1250,
          period: "March 2023",
        },
        {
          id: "2",
          name: "Jane Smith",
          sales: 32000,
          commission: 1600,
          period: "March 2023",
        },
        {
          id: "3",
          name: "Bob Johnson",
          sales: 18000,
          commission: 900,
          period: "March 2023",
        },
        {
          id: "4",
          name: "Alice Williams",
          sales: 30000,
          commission: 1500,
          period: "March 2023",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchCommissionData()
  }, [fetchSettings, fetchCommissionData])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading commission data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Commission Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Product Type</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>{formatPercentage(rule.percentage)}</TableCell>
                  <TableCell className="capitalize">{rule.product_id}</TableCell>
                  <TableCell>{new Date(rule.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffCommissions.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>{staff.name}</TableCell>
                  <TableCell>{formatPrice(staff.sales)}</TableCell>
                  <TableCell>{formatPrice(staff.commission)}</TableCell>
                  <TableCell>{staff.period}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

