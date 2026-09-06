import type { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
}

/** Base skeleton element with shimmer animation */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/60 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Page-level loading skeleton */
export function PageSkeleton() {
  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/** Card loading skeleton */
export function CardSkeleton({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      {children || (
        <div className="flex items-start gap-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Table/list skeleton */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Stats card skeleton */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-gray-50 p-4 text-center">
          <Skeleton className="mx-auto h-3 w-16" />
          <Skeleton className="mx-auto mt-2 h-7 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Profile skeleton */
export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Skeleton className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/** Installment detail skeleton */
export function InstallmentDetailSkeleton() {
  return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3.5 w-48" />
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Payment schedule */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <StatsSkeleton />
        <div className="mt-5 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
