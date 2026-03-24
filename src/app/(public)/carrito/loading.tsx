export default function CartLoading() {
  return (
    <section className="section-shell py-10 md:py-14">
      <div className="mx-auto max-w-3xl animate-pulse">
        {/* Header */}
        <div className="h-3 w-16 rounded-full bg-black/5" />
        <div className="mt-3 h-8 w-48 rounded-full bg-black/5" />

        {/* Cart items */}
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 border-b border-black/5 pb-4"
            >
              <div className="h-20 w-20 bg-black/5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-black/5" />
                <div className="h-3 w-20 rounded-full bg-black/5" />
              </div>
              <div className="h-5 w-16 rounded-full bg-black/5" />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 space-y-3 border-t border-black/5 pt-6">
          <div className="flex justify-between">
            <div className="h-3 w-20 rounded-full bg-black/5" />
            <div className="h-3 w-16 rounded-full bg-black/5" />
          </div>
          <div className="h-12 w-full bg-black/5" />
        </div>
      </div>
    </section>
  );
}
