import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MembersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <div className="border-b px-4 py-3 flex gap-4">
               <Skeleton className="h-4 w-1/4" />
               <Skeleton className="h-4 w-1/4" />
               <Skeleton className="h-4 w-1/4" />
               <Skeleton className="h-4 w-1/4" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
                 <div className="flex items-center gap-3 w-1/4">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                 </div>
                 <div className="w-1/4">
                    <Skeleton className="h-4 w-32" />
                 </div>
                 <div className="w-1/4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                 </div>
                 <div className="w-1/4 flex justify-end">
                    <Skeleton className="size-8" />
                 </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
