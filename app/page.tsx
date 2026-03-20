"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

type Mode = "login" | "register";

export default function HomePage() {
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<"BUYER" | "SUPPLIER">("BUYER");
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    companyName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result =
        mode === "login"
          ? await login(form.email, form.password)
          : await register({ ...form, role });
      if (!result.success) setError(result.error || "Something went wrong");
      else router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-center flex-1 bg-stone-900 px-16 py-12 relative overflow-hidden">
        <div className="relative">
          <div className="text-xs font-semibold tracking-[0.2em] text-emerald-400 uppercase mb-6">
            B2B Commerce Platform
          </div>
          <h1 className="font-serif text-5xl text-white leading-tight mb-6">
            Source better.
            <br />
            <span className="italic text-emerald-400">Close faster.</span>
          </h1>
          <p className="text-stone-400 text-lg leading-relaxed max-w-md mb-12">
            Request quotes from verified suppliers, compare pricing instantly,
            and convert the best offer into a confirmed order.
          </p>
          <div className="flex gap-10">
            {[
              ["RFQs", "Instant requests"],
              ["Quotes", "Compare pricing"],
              ["Orders", "One-click confirm"],
            ].map(([val, label]) => (
              <div key={val}>
                <div className="font-serif text-3xl text-white">{val}</div>
                <div className="text-xs text-emerald-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex flex-col justify-center w-full lg:w-120 px-8 py-12 bg-white">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-8">
            <h2 className="font-serif text-3xl text-stone-900">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-stone-500 text-sm mt-2">
              {mode === "login"
                ? "Sign in to your account"
                : "Get started for free"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-stone-100 rounded-lg p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === m
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                    Full name
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    placeholder="Mohit Kumar"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>

                {/* Role picker */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                    I am a
                  </label>
                  <div className="flex gap-2">
                    {(["BUYER", "SUPPLIER"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                          role === r
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-stone-200 text-stone-500 hover:border-stone-300"
                        }`}
                      >
                        {r === "BUYER" ? "🛒 Buyer" : "🏭 Supplier"}
                      </button>
                    ))}
                  </div>
                </div>

                {role === "SUPPLIER" && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                      Company name
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      placeholder="Sharma Enterprises Pvt Ltd"
                      required
                      value={form.companyName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, companyName: e.target.value }))
                      }
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="you@company.com"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-stone-400 mt-6">
            Demo:{" "}
            <span className="font-medium text-stone-600">buyer@test.com</span>{" "}
            or{" "}
            <span className="font-medium text-stone-600">
              supplier@test.com
            </span>{" "}
            / password123
          </p>
        </div>
      </div>
    </div>
  );
}
