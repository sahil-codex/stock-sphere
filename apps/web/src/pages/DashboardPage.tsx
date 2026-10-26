
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Package,
  AlertTriangle,
  Wallet,
  Boxes,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Search,
  ArrowUpRight,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

type Product = {
  id: string;
  userId: string;
  name: string;
  category: string;
  quantity: number;
  price: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
};

type ProductForm = {
  name: string;
  category: string;
  quantity: string;
  price: string;
  lowStockThreshold: string;
};

type StockTransaction = {
  id: string;
  productId: string;
  productName: string;
  type: "IN" | "OUT";
  quantity: number;
  createdAt: string;
};

type TransactionForm = {
  productId: string;
  type: "IN" | "OUT";
  quantity: string;
};
const emptyForm: ProductForm = {
  name: "",
  category: "",
  quantity: "0",
  price: "",
  lowStockThreshold: "5",
};

const [transactions, setTransactions] = useState<StockTransaction[]>([]);
const [transactionForm, setTransactionForm] =
  useState<TransactionForm>({
    productId: "",
    type: "IN",
    quantity: "1",
  });
const [transactionLoading, setTransactionLoading] = useState(false);
const [transactionError, setTransactionError] = useState("");
const cardClass =
  "rounded-2xl border border-[#DCD3EA] bg-[#F8F6EB]/95 shadow-[0_8px_24px_rgba(91,65,145,0.06)]";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[#DCD3EA] bg-white px-3.5 py-2.5 text-sm text-[#30263F] outline-none transition focus:border-[#8B70CE] focus:ring-2 focus:ring-[#8B70CE]/20";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
        (response.status === 401
          ? "Your session has expired. Please sign in again."
          : `Request failed (${response.status})`),
    );
  }

  return data as T;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getStockStatus(product: Product) {
  if (product.quantity === 0) {
    return {
      label: "Out of stock",
      className: "bg-red-100 text-red-700",
    };
  }

  if (product.quantity <= product.lowStockThreshold) {
    return {
      label: "Low stock",
      className: "bg-amber-100 text-amber-800",
    };
  }

  return {
    label: "In stock",
    className: "bg-emerald-100 text-emerald-800",
  };
}

export function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest<{ products: Product[] }>("/api/products");
      setProducts(data.products);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your products.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
  try {
    const data = await apiRequest<{
      transactions: StockTransaction[];
    }>("/api/transactions");

    setTransactions(data.transactions);
    setTransactionError("");
  } catch (err) {
    setTransactionError(
      err instanceof Error
        ? err.message
        : "Could not load transaction history.",
    );
  }

  useEffect(() => {
  void loadTransactions();
}, [loadTransactions]);


}, []);
  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const totalProducts = products.length;
  const lowStockItems = products.filter(
    (product) => product.quantity <= product.lowStockThreshold,
  ).length;
  const inventoryValue = products.reduce(
    (total, product) =>
      total + product.quantity * Number(product.price),
    0,
  );

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();

    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  function openCreateDialog() {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      quantity: String(product.quantity),
      price: String(product.price),
      lowStockThreshold: String(product.lowStockThreshold),
    });
    setError("");
    setNotice("");
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;
    setDialogOpen(false);
    setEditingProduct(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const quantity = Number(form.quantity);
    const price = Number(form.price);
    const lowStockThreshold = Number(form.lowStockThreshold);

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      form.price.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      setError(
        "Enter a name, category, valid price, and non-negative whole-number quantities.",
      );
      return;
    }

    const payload = {
  name: form.name.trim(),
  category: form.category.trim(),
  price,
  lowStockThreshold,
};

const createPayload = {
  ...payload,
  quantity,
};

    setSaving(true);

    try {
      if (editingProduct) {
        await apiRequest<{ product: Product }>(
          `/api/products/${editingProduct.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(createPayload),
          },
        );
        setNotice("Product updated successfully.");
      } else {
        await apiRequest<{ product: Product }>("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Product added successfully.");
      }

      setDialogOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await apiRequest<{ message: string }>(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      setNotice(`"${product.name}" was deleted.`);
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the product.",
      );
    }
  }

  const stats = [
    {
      title: "Total Products",
      value: String(totalProducts),
      description: "Products in your inventory",
      icon: Package,
    },
    {
      title: "Low Stock Items",
      value: String(lowStockItems),
      description: "Items at or below their threshold",
      icon: AlertTriangle,
    },
    {
      title: "Inventory Value",
      value: formatMoney(inventoryValue),
      description: "Quantity multiplied by unit price",
      icon: Wallet,
    },
  ];
  async function handleStockTransaction(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();
  setTransactionError("");
  setError("");
  setNotice("");

  const quantity = Number(transactionForm.quantity);

  if (
    !transactionForm.productId ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    setTransactionError("Select a product and enter a positive whole quantity.");
    return;
  }

  setTransactionLoading(true);

  try {
    await apiRequest(
      `/api/products/${transactionForm.productId}/transactions`,
      {
        method: "POST",
        body: JSON.stringify({
          type: transactionForm.type,
          quantity,
        }),
      },
    );

    setNotice(
      `Stock ${transactionForm.type === "IN" ? "IN" : "OUT"} recorded successfully.`,
    );

    await Promise.all([loadProducts(), loadTransactions()]);
  } catch (err) {
    setTransactionError(
      err instanceof Error
        ? err.message
        : "Could not record stock transaction.",
    );
  } finally {
    setTransactionLoading(false);
  }
}
  return (
    <main className="soft-geometric-bg min-h-svh p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[#DCD3EA] bg-[#F8F6EB]/90 px-4 py-3 text-sm text-[#655775] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#8B70CE]" />
              Inventory overview
            </div>
            <button
              type="button"
              onClick={() => void loadProducts()}
              disabled={loading}
              aria-label="Refresh products"
              className="rounded-xl border border-[#DCD3EA] bg-[#F8F6EB] p-3 text-[#655775] hover:bg-white disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

        {error && !dialogOpen && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article key={stat.title} className={`${cardClass} p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#777080]">
                      {stat.title}
                    </p>
                    <p className="mt-3 break-words text-2xl font-bold tracking-tight text-[#30263F] sm:text-3xl">
                      {loading ? "…" : stat.value}
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

        <section className={`${cardClass} p-5 sm:p-7`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#30263F]">
                Products
              </h2>
              <p className="mt-1 text-sm text-[#777080]">
                Manage your inventory and stock levels.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7650D8] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#603CB9]"
            >
              <Plus className="h-4 w-4" />
              Add product
            </button>
          </div>

          <div className="mt-6">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92869F]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product name or category..."
                className="w-full rounded-xl border border-[#DCD3EA] bg-white py-3 pl-10 pr-4 text-sm text-[#30263F] outline-none focus:border-[#8B70CE] focus:ring-2 focus:ring-[#8B70CE]/20"
              />
            </label>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-[#777080]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading your products...
            </div>
          ) : error && products.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <p className="mt-3 font-medium text-[#494052]">
                Could not load inventory
              </p>
              <p className="mt-1 text-sm text-[#777080]">{error}</p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="mt-4 rounded-xl bg-[#7650D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#603CB9]"
              >
                Try again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
              <div className="rounded-xl bg-[#EAE2F5] p-3 text-[#8050C8]">
                <Package className="h-6 w-6" />
              </div>
              <p className="mt-3 font-medium text-[#494052]">
                {search ? "No matching products" : "Your inventory starts here"}
              </p>
              <p className="mt-1 max-w-md text-sm text-[#92869F]">
                {search
                  ? "Try a different product name or category."
                  : "Add your first product to start tracking quantities, prices, and low-stock items."}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7650D8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#603CB9]"
                >
                  <Plus className="h-4 w-4" />
                  Add your first product
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mt-5 overflow-x-auto rounded-xl border border-[#E5DDED]">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-[#EAE2F5]/70 text-xs uppercase tracking-wide text-[#655775]">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">Product</th>
                      <th className="px-4 py-3.5 font-semibold">Category</th>
                      <th className="px-4 py-3.5 font-semibold">Quantity</th>
                      <th className="px-4 py-3.5 font-semibold">Unit price</th>
                      <th className="px-4 py-3.5 font-semibold">Stock status</th>
                      <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DDED]">
                    {filteredProducts.map((product) => {
                      const status = getStockStatus(product);

                      return (
                        <tr
                          key={product.id}
                          className="bg-white/50 transition-colors hover:bg-white/90"
                        >
                          <td className="px-4 py-4 font-medium text-[#30263F]">
                            {product.name}
                          </td>
                          <td className="px-4 py-4 text-[#777080]">
                            {product.category}
                          </td>
                          <td className="px-4 py-4 font-medium tabular-nums text-[#494052]">
                            {product.quantity}
                          </td>
                          <td className="px-4 py-4 tabular-nums text-[#494052]">
                            {formatMoney(Number(product.price))}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditDialog(product)}
                                aria-label={`Edit ${product.name}`}
                                className="rounded-lg border border-[#DCD3EA] p-2 text-[#7650D8] hover:bg-[#EAE2F5]"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(product)}
                                aria-label={`Delete ${product.name}`}
                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-[#92869F]">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </>
          )}
        </section>
      </div>
<section className={`${cardClass} p-5 sm:p-7`}>
  <h2 className="text-xl font-semibold text-[#30263F]">
    Stock transactions
  </h2>
  <p className="mt-1 text-sm text-[#777080]">
    Record stock movements and review the transaction ledger.
  </p>

  {transactionError && (
    <p role="alert" className="mt-4 text-sm text-red-700">
      {transactionError}
    </p>
  )}

  <form
    onSubmit={handleStockTransaction}
    className="mt-5 grid gap-4 sm:grid-cols-4"
  >
    <label className="text-sm font-medium text-[#494052]">
      Product
      <select
        className={inputClass}
        value={transactionForm.productId}
        onChange={(event) =>
          setTransactionForm({
            ...transactionForm,
            productId: event.target.value,
          })
        }
        required
      >
        <option value="">Select product</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} — {product.quantity} available
          </option>
        ))}
      </select>
    </label>

    <label className="text-sm font-medium text-[#494052]">
      Movement
      <select
        className={inputClass}
        value={transactionForm.type}
        onChange={(event) =>
          setTransactionForm({
            ...transactionForm,
            type: event.target.value as "IN" | "OUT",
          })
        }
      >
        <option value="IN">Stock IN</option>
        <option value="OUT">Stock OUT</option>
      </select>
    </label>

    <label className="text-sm font-medium text-[#494052]">
      Quantity
      <input
        className={inputClass}
        type="number"
        min="1"
        step="1"
        required
        value={transactionForm.quantity}
        onChange={(event) =>
          setTransactionForm({
            ...transactionForm,
            quantity: event.target.value,
          })
        }
      />
    </label>

    <div className="flex items-end">
      <button
        type="submit"
        disabled={transactionLoading || products.length === 0}
        className="w-full rounded-xl bg-[#7650D8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#603CB9] disabled:opacity-50"
      >
        {transactionLoading ? "Recording..." : "Record movement"}
      </button>
    </div>
  </form>

  <div className="mt-8 overflow-x-auto rounded-xl border border-[#E5DDED]">
    <table className="w-full min-w-[600px] text-left text-sm">
      <thead className="bg-[#EAE2F5]/70 text-xs uppercase tracking-wide text-[#655775]">
        <tr>
          <th className="px-4 py-3">Date</th>
          <th className="px-4 py-3">Product</th>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3 text-right">Quantity</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E5DDED]">
        {transactions.map((transaction) => (
          <tr key={transaction.id} className="bg-white/50">
            <td className="px-4 py-3">
              {new Date(transaction.createdAt).toLocaleString()}
            </td>
            <td className="px-4 py-3">{transaction.productName}</td>
            <td className="px-4 py-3">{transaction.type}</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {transaction.type === "IN" ? "+" : "−"}
              {transaction.quantity}
            </td>
          </tr>
        ))}
        {transactions.length === 0 && (
          <tr>
            <td
              colSpan={4}
              className="px-4 py-8 text-center text-[#777080]"
            >
              No stock transactions recorded yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</section>


      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#21172F]/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-dialog-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-[#DCD3EA] bg-[#F8F6EB] p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="product-dialog-title"
                  className="text-xl font-semibold text-[#30263F]"
                >
                  {editingProduct ? "Edit product" : "Add product"}
                </h2>
                <p className="mt-1 text-sm text-[#777080]">
                  Enter the product details below.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-[#777080] hover:bg-[#EAE2F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="product-name"
                  className="text-sm font-medium text-[#494052]"
                >
                  Product name
                </label>
                <input
                  id="product-name"
                  className={inputClass}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  maxLength={150}
                  required
                  autoFocus
                  placeholder="e.g. Wireless Mouse"
                />
              </div>

              <div>
                <label
                  htmlFor="product-category"
                  className="text-sm font-medium text-[#494052]"
                >
                  Category
                </label>
                <input
                  id="product-category"
                  className={inputClass}
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  maxLength={100}
                  required
                  placeholder="e.g. Electronics"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               {!editingProduct && (
              <div>
                <label
                  htmlFor="product-quantity"
                  className="text-sm font-medium text-[#494052]"
                >
                  Quantity
                </label>
                <input
                  id="product-quantity"
                  type="number"
                  min="0"
                  step="1"
                  className={inputClass}
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                  required
                />
              </div>
               )}

                <div>
                  <label
                    htmlFor="product-price"
                    className="text-sm font-medium text-[#494052]"
                  >
                    Unit price (INR)
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-threshold"
                  className="text-sm font-medium text-[#494052]"
                >
                  Low-stock threshold
                </label>
                <input
                  id="product-threshold"
                  type="number"
                  min="0"
                  step="1"
                  className={inputClass}
                  value={form.lowStockThreshold}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      lowStockThreshold: event.target.value,
                    })
                  }
                  required
                />
                <p className="mt-1.5 text-xs text-[#92869F]">
                  The product is flagged when its quantity reaches this value.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={saving}
                  className="rounded-xl border border-[#DCD3EA] px-4 py-2.5 text-sm font-medium text-[#655775] hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7650D8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#603CB9] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Save changes"
                      : "Create product"}
                  {!saving && <ArrowUpRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
