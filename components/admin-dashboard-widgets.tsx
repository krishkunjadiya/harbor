"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowUpRight, ArrowDownLeft } from "@phosphor-icons/react/dist/ssr"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AdminDashboardWidgets() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Transaction Overview</CardTitle>
          <CardDescription>Transaction volume over time</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {mounted ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R${value}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip
                    formatter={(value) => [`R${value}`, "Amount"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)" }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[350px] w-full bg-muted/20 rounded-md">
              <p className="text-muted-foreground">Loading chart...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest transactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center">
                <Avatar className="h-9 w-9 border">
                  {transaction.type === "credit" ? (
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                  )}
                  <AvatarFallback>{transaction.name[0]}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{transaction.name}</p>
                  <p className="text-sm text-muted-foreground">{transaction.date}</p>
                </div>
                <div className={`ml-auto font-medium ${transaction.type === "credit" ? "text-success" : "text-destructive"}`}>
                  {transaction.type === "credit" ? "+" : "-"}R {transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const chartData = [
  { name: "Jan", total: 45000 },
  { name: "Feb", total: 63500 },
  { name: "Mar", total: 58200 },
  { name: "Apr", total: 72800 },
  { name: "May", total: 85600 },
  { name: "Jun", total: 92400 },
  { name: "Jul", total: 105200 },
  { name: "Aug", total: 91000 },
  { name: "Sep", total: 97500 },
  { name: "Oct", total: 110800 },
  { name: "Nov", total: 142500 },
  { name: "Dec", total: 168000 },
]

const recentTransactions = [
  { id: "1", name: "Thabo Mbeki", amount: 250.0, date: "2023-11-14", type: "credit" },
  { id: "2", name: "Nomzamo Mbatha", amount: 1000.0, date: "2023-11-13", type: "debit" },
  { id: "3", name: "Siya Kolisi", amount: 500.0, date: "2023-11-12", type: "credit" },
  { id: "4", name: "Trevor Noah", amount: 750.0, date: "2023-11-11", type: "debit" },
  { id: "5", name: "Patrice Motsepe", amount: 2500.0, date: "2023-11-10", type: "credit" },
]
