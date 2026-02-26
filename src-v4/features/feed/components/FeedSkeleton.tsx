/**
 * Feed skeleton loaders — shimmer placeholders for social feed cards.
 */
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export function FeedCardSkeleton() {
  return (
    <Card padding="md">
      <div className="flex items-center gap-2.5 mb-3">
        <Skeleton className="h-8 w-8" rounded="full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <Skeleton className="h-3 w-16 mb-3" />
      <div className="grid grid-cols-4 gap-3 mb-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <Skeleton className="h-px w-full mb-3" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
    </Card>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}
