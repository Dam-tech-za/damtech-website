type BlockSkeletonProps = {
  className?: string;
};

export function BlockSkeleton({ className = "" }: BlockSkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-100 ${className}`}
      aria-hidden
    />
  );
}

export function FaqSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <BlockSkeleton className="h-8 w-64" />
      <BlockSkeleton className="h-20 w-full" />
      <BlockSkeleton className="h-20 w-full" />
      <BlockSkeleton className="h-20 w-full" />
    </div>
  );
}
