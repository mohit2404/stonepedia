"use client";

import * as React from "react";

interface Product {
  id: string;
  name: string;
  unit: string;
}

interface Props {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function CreateRFQModal({
  token,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [form, setForm] = React.useState({
    productId: "",
    quantity: "",
    description: "",
    deadline: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/v1/products", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProducts(d.data);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/rfq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: form.productId,
          quantity: parseInt(form.quantity),
          description: form.description || undefined,
          deadline: form.deadline
            ? new Date(form.deadline).toISOString()
            : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        onError(data.error);
        return;
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className=" text-2xl text-stone-900">New RFQ</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Product *
            </label>
            <select
              required
              value={form.productId}
              onChange={(e) =>
                setForm((f) => ({ ...f, productId: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="e.g. 500"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Specifications
            </label>
            <textarea
              placeholder="Grade, quality requirements, special notes…"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none h-20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Quote deadline
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) =>
                setForm((f) => ({ ...f, deadline: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Create RFQ"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
