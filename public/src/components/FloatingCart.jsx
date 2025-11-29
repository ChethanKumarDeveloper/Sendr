
// src/components/FloatingCart.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * FloatingCart
 * - Reads canonical localStorage key "sendr_cart"
 * - Sums qty for item count and price*qty for total
 * - Listens to custom "sendr:cart-updated" and storage events
 */

function readCanonicalCart() {
  try {
    const raw = localStorage.getItem("sendr_cart");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function FloatingCart() {
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  function recalc() {
    const items = readCanonicalCart();
    let c = 0;
    let t = 0;
    for (const it of items) {
      const qty = Number(it.qty || 0);
      const price = Number(it.price || 0);
      c += qty;
      t += qty * price;
    }
    setCount(c);
    setTotal(t);
  }

  useEffect(() => {
    recalc();

    const onCustom = () => recalc();
    window.addEventListener("sendr:cart-updated", onCustom);

    const onStorage = () => recalc();
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("sendr:cart-updated", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <div
      onClick={() => navigate("/cart")}
      className="fixed bottom-6 right-6 z-50 cursor-pointer shadow-lg rounded-full bg-green-600 text-white p-3 flex items-center gap-4"
      role="button"
      aria-label="Open cart"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 3h2l.4 2M7 13h10l4-8H5.4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1" fill="white" />
        <circle cx="18" cy="20" r="1" fill="white" />
      </svg>

      <div className="flex flex-col text-sm text-white pr-2">
        <div className="font-semibold">{count} item{count !== 1 ? "s" : ""}</div>
        <div className="text-xs">₹{total}</div>
      </div>
    </div>
  );
}
