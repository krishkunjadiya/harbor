"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MagnifyingGlass, UserGear as UserCog, Faders, DownloadSimple as Download } from "@phosphor-icons/react"
import Link from "next/link"
import { Profile } from "@/lib/types/database"

interface UsersTableProps {
  users: Profile[]
}

export function UsersTable({ users }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const normalizedSearch = searchTerm.toLowerCase().trim()
      const searchableText = [
        user.full_name,
        user.email,
        user.user_type,
        user.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const tokens = normalizedSearch.split(/\s+/).filter(Boolean)
      const matchedTokens = tokens.filter((token) => searchableText.includes(token)).length
      const minMatchedTokens = Math.max(1, Math.ceil(tokens.length * 0.6))

      // Search filter
      const matchesSearch = tokens.length === 0 || matchedTokens >= minMatchedTokens

      // User type filter
      const matchesType = userTypeFilter === "all" || user.user_type === userTypeFilter

      return matchesSearch && matchesType
    })
  }, [users, searchTerm, userTypeFilter])

  // Export to CSV
  const handleExport = () => {
    const headers = ["Name", "Email", "User Type", "Created At"]
    const csvData = filteredUsers.map(user => [
      user.full_name || "",
      user.email || "",
      user.user_type || "",
      new Date(user.created_at).toLocaleDateString()
    ])

    const csv = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <MagnifyingGlass className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, role, or id..." 
                className="h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Faders className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">User Type</label>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="university">Universities</SelectItem>
                    <SelectItem value="recruiter">Recruiters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setUserTypeFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-auto">
        <div className="w-full min-w-[640px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm || userTypeFilter !== "all" 
                      ? "No users found matching your filters" 
                      : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || "—"}
                    </TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>
                      <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize bg-info/10 text-info dark:bg-info/20 dark:text-info">
                        {user.user_type || "unknown"}
                      </div>
                    </TableCell>
                    <TableCell suppressHydrationWarning>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/users/${user.id}`}>
                          <UserCog className="h-4 w-4" />
                          <span className="sr-only">View user details</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
