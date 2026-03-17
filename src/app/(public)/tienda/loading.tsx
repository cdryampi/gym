function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white">
      <div className="aspect-square animate-pulse bg-[#f1ece4]/80" />
      <div className="space-y-3 p-5 md:p-6">
        <div className="h-2 w-16 animate-pulse rounded-full bg-black/5" />
        <div className="h-6 w-3/4 animate-pulse rounded-full bg-black/5" />
        <div className="h-3 w-full animate-pulse rounded-full bg-black/5" />
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-black/5 pt-4">
          <div className="h-2 w-20 animate-pulse rounded-full bg-black/5" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-black/5" />
        </div>
      </div>
    </div>
  );
}

export default function ShopLoading() {
  return (
    <section className="section-shell py-10 md:py-14">
      <div className="rounded-[28px] border border-black/8 bg-white p-5 shadow-sm sm:p-8">
        <div className="h-3 w-24 animate-pulse rounded-full bg-black/5" />
        <div className="mt-4 h-8 w-48 animate-pulse rounded-full bg-black/5 sm:w-80" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
        <div className="hidden rounded-[32px] border border-black/8 bg-white p-6 shadow-sm lg:block">
          <div className="h-3 w-16 animate-pulse rounded-full bg-black/5" />
          <div className="mt-6 space-y-3">
            <div className="h-10 animate-pulse rounded-2xl bg-black/5" />
            <div className="h-10 animate-pulse rounded-2xl bg-black/5" />
            <div className="h-10 animate-pulse rounded-2xl bg-black/5" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
