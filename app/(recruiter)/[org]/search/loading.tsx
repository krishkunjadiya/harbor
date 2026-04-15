import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SearchLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-2 mt-4">
             <Skeleton className="h-8 w-24 rounded-full" />
             <Skeleton className="h-8 w-24 rounded-full" />
             <Skeleton className="h-8 w-24 rounded-full" />
             <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
               <div className="flex gap-4">
                 <Skeleton className="size-16 rounded-full" />
                 <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2 mt-2">
                       <Skeleton className="h-4 w-20" />
                       <Skeleton className="h-4 w-20" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                 </div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
