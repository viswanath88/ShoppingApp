export default function ProductSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
        >
          <div className="h-48 bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-20" />
            <div className="h-5 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-6 bg-slate-200 rounded w-16" />
              <div className="h-8 bg-slate-200 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
