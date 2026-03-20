"use client";

import { useState } from "react";

interface Props {
  rfq: {
    id: string;
    quantity: number;
    product: { name: string; unit: string };
  };
  token: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function SubmitQuoteModal({
  rfq,
  token,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [form, setForm] = useState({
    pricePerUnit: "",
    deliveryDays: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const total = (parseFloat(form.pricePerUnit) || 0) * rfq.quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/rfq/${rfq.id}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pricePerUnit: parseFloat(form.pricePerUnit),
          deliveryDays: form.deliveryDays
            ? parseInt(form.deliveryDays)
            : undefined,
          notes: form.notes || undefined,
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
        <div className="flex items-center justify-between mb-1">
          <h3 className=" text-2xl text-stone-900">Submit Quote</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-xl"
          >
            ✕
          </button>
        </div>
        <p className="text-stone-500 text-sm mb-5">
          {rfq.product.name} · {rfq.quantity.toLocaleString()}{" "}
          {rfq.product.unit}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Price per {rfq.product.unit} (₹) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="e.g. 250"
              value={form.pricePerUnit}
              onChange={(e) =>
                setForm((f) => ({ ...f, pricePerUnit: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
              <span className="text-sm text-emerald-700">
                Total quote value
              </span>
              <span className=" text-xl text-emerald-700">
                {fmtCurrency(total)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Delivery time (days)
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 7"
              value={form.deliveryDays}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryDays: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Notes
            </label>
            <textarea
              placeholder="Terms, conditions, quality details…"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none h-20"
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
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Submit Quote"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
