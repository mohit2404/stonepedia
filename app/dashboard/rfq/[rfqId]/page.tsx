"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import SubmitQuoteModal from "@/components/modals/SubmitQuoteModal";

interface Quote {
  id: string;
  pricePerUnit: number;
  totalPrice: number;
  deliveryDays: number | null;
  notes: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  supplier: { id: string; companyName: string; user: { name: string } };
}

interface RFQ {
  id: string;
  quantity: number;
  description: string | null;
  deadline: string | null;
  status: string;
  createdAt: string;
  buyer: { id: string; name: string };
  product: { name: string; unit: string; category: string | null };
}

const quoteStatusStyles: Record<string, string> = {
  PENDING: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
};

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function RFQDetailPage() {
  const { rfqId } = useParams<{ rfqId: string }>();

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const router = useRouter();
  const isBuyer = user?.role === "BUYER";

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [rfqRes, quotesRes] = await Promise.all([
      fetch(`/api/v1/rfq?status=ALL`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/v1/rfq/${rfqId}/quotes`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    const rfqData = await rfqRes.json();
    const quotesData = await quotesRes.json();
    if (rfqData.success)
      setRfq(rfqData.data.find((r: RFQ) => r.id === rfqId) || null);
    if (quotesData.success) setQuotes(quotesData.data);
    setLoading(false);
  }, [rfqId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (quoteId: string) => {
    if (
      !confirm(
        "Accept this quote? This will close the RFQ and create an order.",
      )
    )
      return;
    setAccepting(quoteId);
    const res = await fetch(`/api/v1/rfq/${rfqId}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quoteId }),
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error, "error");
      setAccepting(null);
      return;
    }
    showToast("Quote accepted! Order created successfully.");
    load();
    setAccepting(null);
  };

  const cheapestPrice =
    quotes.length > 0 ? Math.min(...quotes.map((q) => q.totalPrice)) : null;

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );

  if (!rfq)
    return (
      <div className="text-center py-24 text-stone-400">RFQ not found.</div>
    );

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        ← Back to dashboard
      </button>

      {/* RFQ header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
              {rfq.product.category}
            </div>
            <h1 className="font-serif text-2xl text-stone-900 mb-1">
              {rfq.product.name}
            </h1>
            <div className="text-stone-500 text-sm">
              {rfq.quantity.toLocaleString()} {rfq.product.unit}
              {rfq.description && <span> · {rfq.description}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                rfq.status === "OPEN"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {rfq.status}
            </span>
            {!isBuyer && rfq.status === "OPEN" && (
              <button
                onClick={() => setShowSubmit(true)}
                className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Submit Quote
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-stone-100 text-sm text-stone-500">
          <span>
            Buyer:{" "}
            <span className="font-medium text-stone-700">{rfq.buyer.name}</span>
          </span>
          {rfq.deadline && (
            <span>
              Deadline:{" "}
              <span className="font-medium text-stone-700">
                {new Date(rfq.deadline).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </span>
          )}
          <span>
            Posted:{" "}
            <span className="font-medium text-stone-700">
              {new Date(rfq.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Quotes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-stone-900">
          Quotes{" "}
          <span className="text-stone-400 font-sans text-base font-normal">
            ({quotes.length})
          </span>
        </h2>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <div className="text-3xl mb-3 opacity-30">💬</div>
          <p className="text-stone-400 text-sm">
            No quotes yet. Suppliers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q, i) => {
            const isBest =
              q.totalPrice === cheapestPrice && q.status === "PENDING";
            return (
              <div
                key={q.id}
                className={`bg-white border rounded-xl p-5 relative transition-all ${
                  isBest
                    ? "border-emerald-300 shadow-sm shadow-emerald-100"
                    : "border-stone-200"
                }`}
              >
                {isBest && (
                  <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">
                    Best price
                  </div>
                )}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-semibold text-stone-800">
                      {q.supplier.companyName}
                    </div>
                    <div className="text-sm text-stone-400">
                      {q.supplier.user.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-2xl text-emerald-700">
                      {fmtCurrency(q.totalPrice)}
                    </div>
                    <div className="text-xs text-stone-400">
                      {fmtCurrency(q.pricePerUnit)} / {rfq.product.unit}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {q.deliveryDays && (
                    <span className="text-xs text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100">
                      🚚 {q.deliveryDays} days delivery
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${quoteStatusStyles[q.status]}`}
                  >
                    {q.status}
                  </span>
                </div>

                {q.notes && (
                  <p className="mt-3 text-sm text-stone-500 bg-stone-50 rounded-lg px-3.5 py-2.5 border border-stone-100">
                    {q.notes}
                  </p>
                )}

                {isBuyer && rfq.status === "OPEN" && q.status === "PENDING" && (
                  <div className="mt-4 flex justify-end">
                    <button
                      disabled={accepting === q.id}
                      onClick={() => handleAccept(q.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {accepting === q.id ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Accept this quote →"
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Quote Modal */}
      {showSubmit && rfq && (
        <SubmitQuoteModal
          rfq={{ id: rfq.id, quantity: rfq.quantity, product: rfq.product }}
          token={token!}
          onClose={() => setShowSubmit(false)}
          onSuccess={() => {
            setShowSubmit(false);
            load();
            showToast("Quote submitted!");
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {/* Toast */}
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg ${
            toast.type === "error" ? "bg-red-600" : "bg-stone-900"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
