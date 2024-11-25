import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoardsPageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[140px]" />
      </div>

      {/* Boards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-6 space-y-4">
            {/* Board Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Board Image */}
                <Skeleton className="w-12 h-12 rounded-lg" />
                {/* Board Title */}
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[160px]" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
              </div>
              {/* Action Button */}
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* Board Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Board Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}