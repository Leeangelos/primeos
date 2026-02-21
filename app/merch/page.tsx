"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type MerchItem = {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string | null;
  price: number;
  sizes: string[];
  sort_order: number;
};

type CartItem = {
  item_id: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  qty: number;
};

function MerchContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  const [brand, setBrand] = useState<"all" | "leeangelos" | "lindseys">("all");
  const [category, setCategory] = useState<"all" | "apparel" | "gear" | "package">("all");
  const [items, setItems] = useState<MerchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/merch?brand=${brand}`).then((r) => r.json());
    if (res.ok) setItems(res.items);
    setLoading(false);
  }, [brand]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = category === "all" ? items : items.filter((i) => i.category === category);

  function addToCart(item: MerchItem) {
    const size = selectedSizes[item.id] || item.sizes[0] || "One Size";
    const existing = cart.find((c) => c.item_id === item.id && c.size === size);
    if (existing) {
      setCart(cart.map((c) => c.item_id === item.id && c.size === size ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { item_id: item.id, name: item.name, brand: item.brand, price: item.price, size, qty: 1 }]);
    }
  }

  function removeFromCart(index: number) {
    setCart(cart.filter((_, i) => i !== index));
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartTax = +(cartTotal * 0.075).toFixed(2);
  const cartGrandTotal = +(cartTotal + cartTax).toFixed(2);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  async function handleCheckout() {
    if (cart.length === 0 || !employeeName) return;
    setCheckingOut(true);

    const res = await fetch("/api/merch/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_name: employeeName,
        employee_email: employeeEmail || null,
        items: cart,
      }),
    }).then((r) => r.json());

    if (res.ok && res.url) {
      window.location.href = res.url;
    } else {
      alert(res.error || "Checkout failed");
      setCheckingOut(false);
    }
  }

  const brandColor = (b: string) => b === "lindseys" ? "border-purple-500/30 bg-purple-500/5" : "border-orange-500/30 bg-orange-500/5";
  const brandBadge = (b: string) => b === "lindseys" ? "bg-purple-500/15 text-purple-400" : "bg-orange-500/15 text-orange-400";

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-4 sm:p-5 space-y-3">
        <h1 className="text-lg font-semibold sm:text-2xl">Team Merch</h1>
        <p className="text-xs text-muted">Official team apparel and gear. Order and pay through Stripe.</p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {[
            { key: "all", label: "All Brands" },
            { key: "leeangelos", label: "LeeAngelo's" },
            { key: "lindseys", label: "Lindsey's" },
          ].map((b) => (
            <button key={b.key} type="button" onClick={() => setBrand(b.key as any)} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition-colors", brand === b.key ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}>{b.label}</button>
          ))}
        </div>

        <div className="flex gap-2 justify-center">
          {[
            { key: "all", label: "All" },
            { key: "package", label: "Packages" },
            { key: "apparel", label: "Apparel" },
            { key: "gear", label: "Gear" },
          ].map((c) => (
            <button key={c.key} type="button" onClick={() => setCategory(c.key as any)} className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-medium", category === c.key ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted")}>{c.label}</button>
          ))}
        </div>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-5 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="text-lg font-bold text-emerald-400">Order Placed!</div>
          <p className="text-xs text-muted mt-1">Your merch is on the way. LeeAnn will coordinate delivery.</p>
        </div>
      )}

      {canceled && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5 text-center text-sm text-amber-400">Checkout canceled. Your cart is still here.</div>
      )}

      {/* Cart floating button */}
      {cartCount > 0 && !showCart && (
        <button type="button" onClick={() => setShowCart(true)} className="fixed bottom-6 right-6 z-50 rounded-full bg-brand text-white h-14 w-14 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] text-lg font-bold">
          {cartCount}
        </button>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-5"><div className="h-6 w-32 bg-muted/20 rounded mb-2" /><div className="h-4 w-48 bg-muted/20 rounded" /></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Packages first — Hormozi style */}
          {filtered.filter((i) => i.category === "package").length > 0 && (
            <div className="space-y-3">
              {filtered.filter((i) => i.category === "package").map((item) => {
                const isMostPopular = item.description?.includes("MOST POPULAR");
                const isBestValue = item.description?.includes("BEST VALUE");
                const isLindseys = item.brand === "lindseys";
                const accentBorder = isLindseys ? "border-purple-500" : "border-orange-500";
                const accentBg = isLindseys ? "bg-purple-500" : "bg-orange-500";
                const accentText = isLindseys ? "text-purple-400" : "text-orange-400";
                const accentBgLight = isLindseys ? "bg-purple-500/10" : "bg-orange-500/10";

                // Parse description
                const parts = (item.description || "").split("·").map((s: string) => s.trim());
                const badge = isMostPopular ? "MOST POPULAR" : isBestValue ? "BEST VALUE" : null;
                const includesText = parts.find((p: string) => p.startsWith("INCLUDES:"))?.replace("INCLUDES: ", "") || "";
                const savingsText = parts.find((p: string) => p.startsWith("You save")) || "";
                const valueText = parts.find((p: string) => p.includes("value"))?.match(/\(\$[\d,.]+ value\)/)?.[0] || "";
                const tagline = parts.find((p: string) => !p.startsWith("INCLUDES:") && !p.startsWith("You save") && !p.includes("MOST POPULAR") && !p.includes("BEST VALUE") && !p.includes("value")) || "";

                return (
                  <div key={item.id} className={cn("rounded-xl border-2 p-5 space-y-3 relative", isMostPopular || isBestValue ? accentBorder : "border-border/50", isMostPopular || isBestValue ? accentBgLight : "bg-black/20")}>
                    {badge && (
                      <div className={cn("absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white", accentBg)}>{badge}</div>
                    )}
                    <div className="flex items-start justify-between pt-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[9px] uppercase font-bold px-2 py-0.5 rounded", isLindseys ? "bg-purple-500/15 text-purple-400" : "bg-orange-500/15 text-orange-400")}>{isLindseys ? "Lindsey's" : "LeeAngelo's"}</span>
                        </div>
                        <h3 className="text-lg font-black text-white">{item.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-2xl font-black tabular-nums", accentText)}>${item.price}</div>
                        {valueText && <div className="text-[10px] text-muted line-through">{valueText.replace("(", "").replace(")", "")}</div>}
                      </div>
                    </div>

                    {includesText && (
                      <div className="space-y-1.5">
                        {includesText.split(" + ").map((inc: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-400">✓</span>
                            <span className="text-white/80">{inc.trim()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {tagline && <p className="text-xs text-muted italic">{tagline}</p>}

                    {savingsText && (
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-center">
                        <span className="text-xs font-bold text-emerald-400">{savingsText}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {item.sizes.length > 1 ? (
                        <select
                          value={selectedSizes[item.id] || item.sizes[0]}
                          onChange={(e) => setSelectedSizes({ ...selectedSizes, [item.id]: e.target.value })}
                          className="rounded-lg border border-border/50 bg-black/30 text-white text-xs px-2 py-2 flex-1"
                        >
                          {item.sizes.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-muted flex-1">{item.sizes[0]}</span>
                      )}
                      <button type="button" onClick={() => addToCart(item)} className={cn("rounded-lg border px-6 py-2 text-sm font-bold transition-colors", isLindseys ? "border-purple-500/50 bg-purple-500 text-white hover:bg-purple-600" : "border-orange-500/50 bg-orange-500 text-white hover:bg-orange-600")}>Add to Cart</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Individual items */}
          {filtered.filter((i) => i.category !== "package").length > 0 && (
            <>
              <div className="text-[10px] uppercase text-muted tracking-wider px-1 mt-4">Individual Items</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.filter((i) => i.category !== "package").map((item) => {
                  const isLindseys = item.brand === "lindseys";
                  return (
                    <div key={item.id} className={cn("rounded-lg border p-4 space-y-3", isLindseys ? "border-purple-500/30 bg-purple-500/5" : "border-orange-500/30 bg-orange-500/5")}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-[9px] uppercase font-bold px-2 py-0.5 rounded", isLindseys ? "bg-purple-500/15 text-purple-400" : "bg-orange-500/15 text-orange-400")}>{isLindseys ? "Lindsey's" : "LeeAngelo's"}</span>
                            {item.category === "gear" && <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-muted/15 text-muted">Gear</span>}
                          </div>
                          <h3 className="text-sm font-bold text-white">{item.name}</h3>
                          {item.description && <p className="text-[11px] text-muted mt-1 leading-relaxed">{item.description}</p>}
                        </div>
                        <div className="text-lg font-black tabular-nums text-white">${item.price}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.sizes.length > 1 ? (
                          <select
                            value={selectedSizes[item.id] || item.sizes[0]}
                            onChange={(e) => setSelectedSizes({ ...selectedSizes, [item.id]: e.target.value })}
                            className="rounded-lg border border-border/50 bg-black/30 text-white text-xs px-2 py-1.5 flex-1"
                          >
                            {item.sizes.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-muted flex-1">{item.sizes[0] || "One Size"}</span>
                        )}
                        <button type="button" onClick={() => addToCart(item)} className={cn("rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors", isLindseys ? "border-purple-500/50 bg-purple-500/15 text-purple-400 hover:bg-purple-500/25" : "border-orange-500/50 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25")}>Add to Cart</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={() => setShowCart(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-t-2xl sm:rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowCart(false)} className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none">✕</button>
            <h3 className="text-base font-semibold text-brand mb-4">Your Cart ({cartCount} items)</h3>

            {cart.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border/30 bg-black/20 p-3">
                      <div>
                        <div className="text-sm text-white font-medium">{item.name}</div>
                        <div className="text-[10px] text-muted">{item.brand === "lindseys" ? "Lindsey's" : "LeeAngelo's"} · {item.size} · Qty: {item.qty}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums">${(item.price * item.qty).toFixed(2)}</span>
                        <button type="button" onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/30 pt-3 space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-muted"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs text-muted"><span>Tax (7.5%)</span><span>${cartTax.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm font-bold text-brand"><span>Total</span><span>${cartGrandTotal.toFixed(2)}</span></div>
                </div>

                <div className="space-y-2 mb-4">
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full rounded-lg border border-border/50 bg-black/30 text-white text-sm px-3 py-2 placeholder:text-muted/50"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional — for receipt)"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    className="w-full rounded-lg border border-border/50 bg-black/30 text-white text-sm px-3 py-2 placeholder:text-muted/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkingOut || !employeeName || cart.length === 0}
                  className={cn(
                    "w-full rounded-xl py-3 text-center text-sm font-bold transition-all",
                    checkingOut || !employeeName
                      ? "bg-muted/20 text-muted cursor-wait"
                      : "bg-brand text-white hover:bg-brand/90 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                  )}
                >
                  {checkingOut ? "Redirecting to payment..." : `Pay $${cartGrandTotal.toFixed(2)} with Stripe`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MerchPage() {
  return (
    <Suspense fallback={<div className="space-y-5 p-5"><div className="h-8 w-48 bg-muted/20 rounded animate-pulse" /></div>}>
      <MerchContent />
    </Suspense>
  );
}
