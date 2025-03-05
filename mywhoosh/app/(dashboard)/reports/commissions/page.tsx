"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for commission rules
const mockCommissionRules = [
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
]

// Mock data for staff commissions
const mockStaffCommissions = [
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
]

export default function CommissionsPage() {
  const [commissionRules] = useState(mockCommissionRules)
  const [staffCommissions] = useState(mockStaffCommissions)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage}%`
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
                  <TableCell>{formatCurrency(staff.sales)}</TableCell>
                  <TableCell>{formatCurrency(staff.commission)}</TableCell>
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

