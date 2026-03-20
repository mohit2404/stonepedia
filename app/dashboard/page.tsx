"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import CreateRFQModal from "@/components/modals/CreateRFQModal";

interface RFQ {
  id: string;
  quantity: number;
  description: string | null;
  deadline: string | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  createdAt: string;
  buyer: { id: string; name: string; email: string };
  product: { id: string; name: string; unit: string; category: string | null };
  _count: { quotes: number };
}

const statusStyles: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-stone-100 text-stone-500",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const router = useRouter();
  const isBuyer = user?.role === "BUYER";

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"OPEN" | "CLOSED" | "ALL">("OPEN");
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/rfq?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setRfqs(data.data);
    setLoading(false);
  }, [filter, token]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const stats = [
    { label: "Total RFQs", value: rfqs.length },
    { label: "Open", value: rfqs.filter((r) => r.status === "OPEN").length },
    {
      label: "Closed",
      value: rfqs.filter((r) => r.status === "CLOSED").length,
    },
    {
      label: "Total quotes",
      value: rfqs.reduce((s, r) => s + r._count.quotes, 0),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone-900 mb-1">
            {isBuyer ? "RFQ Marketplace" : "Open Requests"}
          </h1>
          <p className="text-stone-500 text-sm">
            {isBuyer
              ? "Manage your quote requests and track incoming offers."
              : "Browse open RFQs and submit competitive quotes."}
          </p>
        </div>
        {isBuyer && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> New RFQ
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white border border-stone-200 rounded-xl p-4"
          >
            <div className="font-serif text-3xl text-emerald-600 mb-1">
              {s.value}
            </div>
            <div className="text-xs text-stone-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(["OPEN", "CLOSED", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f === "ALL" ? "ALL" : f)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-all ${
              filter === f
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto text-sm text-stone-400 hover:text-stone-700 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
        </div>
      ) : rfqs.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-16 text-center">
          <div className="text-4xl mb-4 opacity-30">📋</div>
          <h3 className="font-serif text-xl text-stone-700 mb-2">
            No RFQs found
          </h3>
          <p className="text-stone-400 text-sm mb-4">
            {isBuyer
              ? "Create your first RFQ to start receiving quotes."
              : "No open requests right now."}
          </p>
          {isBuyer && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              + Create RFQ
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                {[
                  "Product",
                  "Qty",
                  "Buyer",
                  "Deadline",
                  "Quotes",
                  "Status",
                  "Created",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wide px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rfqs.map((rfq) => (
                <tr
                  key={rfq.id}
                  className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-stone-800">
                      {rfq.product.name}
                    </div>
                    {rfq.product.category && (
                      <div className="text-xs text-stone-400">
                        {rfq.product.category}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-stone-600 tabular-nums">
                    {rfq.quantity.toLocaleString()} {rfq.product.unit}
                  </td>
                  <td className="px-4 py-3.5 text-stone-500 hidden md:table-cell">
                    {rfq.buyer.name}
                  </td>
                  <td className="px-4 py-3.5 text-stone-400 hidden lg:table-cell">
                    {rfq.deadline ? fmt(rfq.deadline) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                        rfq._count.quotes > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {rfq._count.quotes}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusStyles[rfq.status]}`}
                    >
                      {rfq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-stone-400 hidden lg:table-cell">
                    {fmt(rfq.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => router.push(`/dashboard/rfq/${rfq.id}`)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 px-3 py-1.5 rounded-lg transition-all"
                    >
                      {isBuyer ? "View quotes" : "View & quote"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create RFQ Modal */}
      {showCreate && (
        <CreateRFQModal
          token={token!}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            load();
            showToast("RFQ created successfully!");
          }}
          onError={(msg) => showToast(msg)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-stone-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
