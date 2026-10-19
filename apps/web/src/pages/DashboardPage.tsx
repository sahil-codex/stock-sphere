
export function DashboardPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            StockSphere
          </h1>
          <p className="text-muted-foreground">
            Inventory management dashboard
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">
              Total Products
            </p>
            <p className="mt-2 text-3xl font-bold">—</p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">
              Low Stock Items
            </p>
            <p className="mt-2 text-3xl font-bold">—</p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">
              Inventory Value
            </p>
            <p className="mt-2 text-3xl font-bold">—</p>
          </div>
        </section>

        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your inventory overview will appear here.
          </p>
        </section>
      </div>
    </main>
  );
}
