export default function Loading() {
  return (
    <div className="min-h-screen pt-[72px]">
      {/* Hero Skeleton */}
      <div className="h-[85vh] min-h-[600px] bg-bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        <div className="absolute bottom-16 left-8 max-w-xl space-y-4">
          <div className="h-4 w-24 rounded-full skeleton" />
          <div className="h-12 w-full rounded-xl skeleton" />
          <div className="h-4 w-3/4 rounded-xl skeleton" />
          <div className="h-10 w-32 rounded-xl skeleton" />
        </div>
      </div>

      {/* Content Skeletons */}
      <div className="bg-gradient-to-b from-bg-primary to-bg-secondary">
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-8">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-4">
              <div className="h-5 w-40 rounded skeleton" />
              <div className="h-3 w-64 rounded skeleton mt-2" />
            </div>
            <div className="flex gap-4 px-4 sm:px-6 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
                  <div className="aspect-[2/3] rounded-xl skeleton mb-3" />
                  <div className="h-4 w-3/4 rounded skeleton" />
                  <div className="h-3 w-1/2 rounded skeleton mt-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
