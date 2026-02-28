"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEED_MERCH } from "@/src/lib/seed-data";

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
  const [showEducation, setShowEducation] = useState(false);
  const [checkoutToast, setCheckoutToast] = useState(false);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/merch?brand=${brand}`).then((r) => r.json());
    if (res.ok && Array.isArray(res.items) && res.items.length > 0) {
      setItems(res.items);
    } else {
      setItems(SEED_MERCH);
    }
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
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1500);
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

  const brandColor = (b: string) => b === "lindseys" ? "border-zinc-700 bg-zinc-800/50" : "border-orange-500/30 bg-orange-500/5";
  const brandBadge = (b: string) => b === "lindseys" ? "bg-zinc-700/50 text-zinc-300" : "bg-orange-500/15 text-orange-400";

  return (
    <>
      <div className="space-y-5 pb-28">
        <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Team Merch</h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
        </div>
        <p className="text-xs text-muted">Official team apparel and gear. Order and pay through Stripe.</p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {[
            { key: "all", label: "All Brands" },
            { key: "leeangelos", label: "LeeAngelo's" },
            { key: "lindseys", label: "Lindsey's" },
          ].map((b) => (
            <button key={b.key} type="button" onClick={() => setBrand(b.key as any)} className={cn("min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors", brand === b.key ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}>{b.label}</button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { key: "all", label: "All" },
            { key: "package", label: "Packages" },
            { key: "apparel", label: "Apparel" },
            { key: "gear", label: "Gear" },
          ].map((c) => (
            <button key={c.key} type="button" onClick={() => setCategory(c.key as any)} className={cn("min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-medium", category === c.key ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted")}>{c.label}</button>
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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-5"><div className="h-6 w-32 bg-muted/20 rounded mb-2" /><div className="h-4 w-48 bg-muted/20 rounded" /></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 pb-40">
          {/* Packages first — Hormozi style */}
          {filtered.filter((i) => i.category === "package").length > 0 && (
            <div className="space-y-3">
              {filtered.filter((i) => i.category === "package").map((item) => {
                const isMostPopular = item.description?.includes("MOST POPULAR");
                const isBestValue = item.description?.includes("BEST VALUE");
                const isLindseys = item.brand === "lindseys";
                const accentBorder = isLindseys ? "border-zinc-600" : "border-orange-500";
                const accentBg = isLindseys ? "bg-zinc-600" : "bg-orange-500";
                const accentText = isLindseys ? "text-zinc-300" : "text-orange-400";
                const accentBgLight = isLindseys ? "bg-zinc-500/10" : "bg-orange-500/10";

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
                          <span className={cn("text-[9px] uppercase font-bold px-2 py-0.5 rounded", isLindseys ? "bg-zinc-700/50 text-zinc-300" : "bg-orange-500/15 text-orange-400")}>{isLindseys ? "Lindsey's" : "LeeAngelo's"}</span>
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
                      <button type="button" onClick={() => addToCart(item)} className={cn("rounded-lg border px-6 py-2 text-sm font-bold transition-colors", addedItemId === item.id ? "border-emerald-600 bg-emerald-600 text-white" : isLindseys ? "border-zinc-600 bg-zinc-600 text-white hover:bg-zinc-500" : "border-orange-500/50 bg-orange-500 text-white hover:bg-orange-600")}>{addedItemId === item.id ? "✓ Added" : "Add to Cart"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Individual items — single column on mobile, image placeholder + name, price, sizes, Order */}
          {filtered.filter((i) => i.category !== "package").length > 0 && (
            <>
              <div className="text-[10px] uppercase text-muted tracking-wider px-1 mt-4">Individual Items</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.filter((i) => i.category !== "package").map((item) => {
                  const isLindseys = item.brand === "lindseys";
                  return (
                    <div key={item.id} className={cn("rounded-xl border overflow-hidden", isLindseys ? "border-zinc-700 bg-zinc-800/50" : "border-orange-500/30 bg-orange-500/5")}>
                      <div className="aspect-square bg-black/40 flex items-center justify-center">
                        <Shirt className="w-16 h-16 text-muted/50" aria-hidden />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-[9px] uppercase font-bold px-2 py-0.5 rounded", isLindseys ? "bg-zinc-700/50 text-zinc-300" : "bg-orange-500/15 text-orange-400")}>{isLindseys ? "Lindsey's" : "LeeAngelo's"}</span>
                              {item.category === "gear" && <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-muted/15 text-muted">Gear</span>}
                            </div>
                            <h3 className="text-sm font-bold text-white">{item.name}</h3>
                            {item.description && <p className="text-[11px] text-muted mt-1 leading-relaxed line-clamp-2">{item.description}</p>}
                          </div>
                          <div className="text-lg font-black tabular-nums text-white shrink-0">${item.price}</div>
                        </div>
                        <div className="text-[10px] text-muted">Sizes: {item.sizes.join(", ")}</div>
                        <div className="flex items-center gap-2">
                          {item.sizes.length > 1 ? (
                            <select
                              value={selectedSizes[item.id] || item.sizes[0]}
                              onChange={(e) => setSelectedSizes({ ...selectedSizes, [item.id]: e.target.value })}
                              className="rounded-lg border border-border/50 bg-black/30 text-white text-xs px-2 py-2 flex-1 min-h-[44px]"
                            >
                              {item.sizes.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-muted flex-1 py-2">{item.sizes[0] || "One Size"}</span>
                          )}
                          <button type="button" onClick={() => addToCart(item)} className={cn("rounded-lg border px-4 py-2 min-h-[44px] text-sm font-bold transition-colors shrink-0", addedItemId === item.id ? "border-emerald-600 bg-emerald-600 text-white" : isLindseys ? "border-zinc-600 bg-zinc-600 text-white hover:bg-zinc-500" : "border-orange-500/50 bg-orange-500 text-white hover:bg-orange-600")}>{addedItemId === item.id ? "✓ Added" : "Order"}</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Cart bottom sheet */}
      {showCart && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowCart(false)} aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-800 rounded-t-2xl border-t border-slate-700 p-5 pb-28 max-h-[70vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-4">Your Cart</h3>

            {cart.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">Cart is empty</p>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-700">
                    <div>
                      <div className="text-sm text-white">{item.name}</div>
                      <div className="text-xs text-slate-400">Qty: {item.qty} × ${item.price}</div>
                    </div>
                    <div className="text-sm text-white font-medium">${(item.qty * item.price).toFixed(2)}</div>
                  </div>
                ))}

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-700">
                  <span className="text-base font-bold text-white">Total</span>
                  <span className="text-base font-bold text-emerald-400">${cartTotal.toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutToast(true);
                    setTimeout(() => setCheckoutToast(false), 3000);
                  }}
                  className="w-full py-3 rounded-xl bg-[#E65100] hover:bg-orange-600 text-white text-sm font-semibold mt-4 transition-colors"
                >
                  Checkout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setShowCart(false);
                  }}
                  className="w-full py-3 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold mt-2"
                >
                  Clear Cart
                </button>
              </>
            )}
          </div>
        </>
      )}

      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Why Branded Gear Builds Team Identity</h3>
            <p className="text-xs text-muted mb-4">Package value stacking and the real ROI of merch.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Why Branded Gear Matters</h4>
                <p className="text-muted text-xs leading-relaxed">When your crew wears your brand, they represent you on and off the clock. A cook in a LeeAngelo's tee is walking advertising. More than that — it builds identity. "We're on the same team." That reduces turnover and makes new hires feel part of something. Shops that invest in one good run of tees and hats see better retention. It's not just swag; it's culture.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Package Value Stacking</h4>
                <p className="text-muted text-xs leading-relaxed">Bundles (shirt + hat + apron) feel like a deal and move more product. "New hire pack" or "opening crew pack" gives one price for everything they need. You're not nickel-and-diming; you're giving a clear value. Stack the items, show the "you save" number, and watch take-up. One package per new hire is a no-brainer — they look the part day one.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Merch Sits in the Closet</h4>
                <p className="text-muted text-xs leading-relaxed">If nobody's buying, either the design is wrong or the price is. Ask the team what they'd actually wear. One good design beats five mediocre ones. And don't use merch as a substitute for pay — it's a perk and identity builder. If turnover is high, fix pay and culture first; then add merch so they're proud to wear it.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {cartCount > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t border-zinc-700 px-5 py-4 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.3)]" style={{ position: "sticky", bottom: 0 }}>
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
            <span className="text-[#E65100] font-bold">${cartTotal.toFixed(2)}</span>
          </div>
          <button type="button" onClick={handleCheckout} className="bg-[#E65100] text-white font-semibold px-6 py-2.5 rounded-xl">
            Checkout
          </button>
        </div>
      )}
      </div>

      {checkoutToast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 shadow-lg text-center">
          <p className="text-xs text-slate-300">Demo Mode — Merch checkout is coming in Phase 2.</p>
        </div>
      )}
    </>
  );
}

export default function MerchPage() {
  return (
    <Suspense fallback={<div className="space-y-5 p-5"><div className="h-8 w-48 bg-muted/20 rounded animate-pulse" /></div>}>
      <MerchContent />
    </Suspense>
  );
}
