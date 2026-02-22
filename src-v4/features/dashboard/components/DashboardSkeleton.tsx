import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-8 pb-20 md:pb-6 pt-6">
      {/* CompactHero skeleton */}
      <Card padding="md" className="border-t-2 border-t-edge-default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </Card>

      {/* Two-column skeleton */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* Feed skeleton */}
        <div className="w-full lg:w-[65%] space-y-4">
          {/* Filter tabs skeleton */}
          <div className="flex gap-3 mb-4 border-b border-edge-default pb-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="flex items-center gap-2.5 mb-3">
                <Skeleton className="h-8 w-8" rounded="full" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-16 mb-3" />
              <div className="grid grid-cols-4 gap-3">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </Card>
          ))}
        </div>

        {/* Sidebar skeleton */}
        <div className="w-full lg:w-[35%] space-y-4">
          <Card padding="md">
            <div className="flex flex-col items-center">
              <Skeleton className="h-16 w-16 mb-3" rounded="full" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-3 w-40" />
            </div>
          </Card>
          <Card padding="md">
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
