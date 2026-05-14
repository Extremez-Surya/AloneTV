export default function Loading() {
  return (
    <div className="min-h-screen pt-[72px]">
      {/* Hero Skeleton */}
      <div className="h-[85vh] min-h-[600px] bg-bg-card animate-pulse" />

      {/* Content Skeletons */}
      <div className="bg-gradient-to-b from-bg-primary to-bg-secondary">
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-8">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-4">
              <div className="h-6 w-40 bg-bg-card rounded animate-pulse" />
            </div>
            <div className="flex gap-4 px-4 sm:px-6 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
                  <div className="aspect-[2/3] rounded-xl bg-bg-card animate-pulse mb-3" />
                  <div className="h-4 w-3/4 bg-bg-card rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-bg-card rounded mt-2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}