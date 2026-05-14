interface SkeletonLoaderProps {
  variant?: 'card' | 'banner' | 'row' | 'text';
  count?: number;
}

export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
      <div className="aspect-[2/3] rounded-xl skeleton mb-3" />
      <div className="h-4 w-3/4 skeleton rounded" />
      <div className="h-3 w-1/2 skeleton rounded mt-2" />
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="relative h-[85vh] min-h-[600px] bg-bg-card">
      <div className="absolute inset-0 skeleton" />
      <div className="absolute inset-0 flex items-end p-20">
        <div className="max-w-2xl space-y-4">
          <div className="h-12 w-3/4 skeleton rounded" />
          <div className="h-6 w-1/2 skeleton rounded" />
          <div className="h-10 w-48 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <section className="py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-4">
        <div className="h-6 w-40 skeleton rounded" />
      </div>
      <div className="flex gap-4 px-4 sm:px-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 skeleton rounded"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

function SkeletonLoader({ variant = 'card', count = 1 }: SkeletonLoaderProps) {
  if (variant === 'banner') {
    return <SkeletonBanner />;
  }

  if (variant === 'row') {
    return <SkeletonRow />;
  }

  if (variant === 'text') {
    return <SkeletonText lines={count} />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonLoader;