import { CreateUserDialog } from "@/components/create-user-dialog"
import { getAllUsers } from "@/lib/actions/database"
import { UsersTable } from "./users-table"

export default async function UsersPage() {
  // Fetch all users from the database
  const users = await getAllUsers()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts across the platform</p>
        </div>
        <CreateUserDialog />
      </div>

      <UsersTable users={users} />
    </div>
  )
}