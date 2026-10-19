
import {
  Package,
  AlertTriangle,
  Wallet,
  Boxes,
  ArrowUpRight,
} from "lucide-react";

const stats = [
  {
    title: "Total Products",
    value: "—",
    description: "Products in your inventory",
    icon: Package,
  },
  {
    title: "Low Stock Items",
    value: "—",
    description: "Items needing restocking",
    icon: AlertTriangle,
  },
  {
    title: "Inventory Value",
    value: "—",
    description: "Total value of your stock",
    icon: Wallet,
  },
];

export function DashboardPage() {
  return (
    <main className="soft-geometric-bg min-h-svh p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#A98BE8] to-[#7650D8] text-white shadow-md shadow-purple-300/30">
                <Boxes className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#30263F]">
                Stock<span className="text-[#8058D8]">Sphere</span>
              </h1>
            </div>
            <p className="mt-2 text-[#777080]">
              Inventory management dashboard
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#DCD3EA] bg-[#F8F6EB]/90 px-4 py-3 text-sm text-[#655775] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#8B70CE]" />
            Inventory overview
          </div>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.title}
                className="rounded-2xl border border-[#DCD3EA] bg-[#F8F6EB]/95 p-6 shadow-[0_8px_24px_rgba(91,65,145,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(91,65,145,0.10)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#777080]">
                      {stat.title}
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#30263F]">
                      {stat.value}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#EAE2F5] p-3 text-[#8058D8]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-4 text-sm text-[#92869F]">
                  {stat.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-[#DCD3EA] bg-[#F8F6EB]/95 p-6 shadow-[0_8px_24px_rgba(91,65,145,0.06)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#30263F]">
                Products
              </h2>
              <p className="mt-1 text-sm text-[#777080]">
                Your inventory overview will appear here.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7650D8] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#603CB9]"
            >
              View inventory
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#DCD3EA] bg-white/40 px-4 text-center">
            <div className="rounded-xl bg-[#EAE2F5] p-3 text-[#8050C8]">
              <Package className="h-6 w-6" />
            </div>
            <p className="mt-3 font-medium text-[#494052]">
              Your inventory starts here
            </p>
            <p className="mt-1 text-sm text-[#92869F]">
              Product information and stock levels will appear in this area.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
