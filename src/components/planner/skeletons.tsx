"use client";

import { Card } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Hero skeleton */}
      <Card className="p-5 card-shadow">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="space-y-2">
            <div className="h-3 w-24 shimmer rounded" />
            <div className="h-9 w-40 shimmer rounded" />
            <div className="h-3 w-32 shimmer rounded" />
          </div>
          <div className="h-9 w-9 shimmer rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg p-2.5 bg-muted/50">
              <div className="h-2.5 w-16 shimmer rounded mb-1.5" />
              <div className="h-4 w-20 shimmer rounded" />
            </div>
          ))}
        </div>
      </Card>

      {/* Save recommendation skeleton */}
      <Card className="p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 shimmer rounded-lg" />
          <div className="h-3 w-32 shimmer rounded" />
        </div>
        <div className="h-8 w-40 shimmer rounded mb-2" />
        <div className="h-2.5 w-48 shimmer rounded" />
      </Card>

      {/* Chart skeleton */}
      <Card className="p-4 card-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-40 shimmer rounded" />
          <div className="h-4 w-16 shimmer rounded" />
        </div>
        <div className="h-44 w-full shimmer rounded" />
      </Card>

      {/* More cards */}
      {[0, 1].map((i) => (
        <Card key={i} className="p-4 card-shadow">
          <div className="h-3 w-24 shimmer rounded mb-3" />
          <div className="h-7 w-32 shimmer rounded mb-2" />
          <div className="h-2 w-48 shimmer rounded" />
        </Card>
      ))}
    </div>
  );
}
