// src/pages/Customer/CustomerCart.jsx
import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  serverTimestamp,
  addDoc,
  collection,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

/**
 * CustomerCart (stable)
 * - Creates order doc, then writes orderId into it
 * - Shows tracking link to customer and navigates to tracking page
 * - Clears all legacy cart keys and updates UI + floating cart
 */

const KNOWN_KEYS = [
  "sendr_cart",
  "sendr_cart_v1",
  "cart",
  "cart_items",
  "cartItems",
  "local_cart",
  "sendr_cart_for_payment",
];

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeItem(it) {
  if (!it || typeof it !== "object") return null;
  const productId = it.productId || it.id || it.productID || null;
  return {
    productId,
    name: it.name || it.title || "Unknown Product",
    price: Number(it.price || 0),
    qty: Number(it.qty || it.quantity || 1),
    imageUrl: it.imageUrl || it.image || "",
    unit: it.unit || "",
  };
}

function readAllCandidates() {
  const found = [];
  for (const k of KNOWN_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw === null) continue;
    const parsed = safeParse(raw);
    found.push({ key: k, parsed });
  }

  // also find other keys containing "cart"
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (KNOWN_KEYS.includes(key)) continue;
    if (!/cart/i.test(key)) continue;
    const raw = localStorage.getItem(key);
    const parsed = safeParse(raw);
    found.push({ key, parsed });
  }

  return found;
}

function canonicalize(found) {
  const canonical = found.find((f) => f.key === "sendr_cart");
  if (canonical && Array.isArray(canonical.parsed) && canonical.parsed.length > 0) {
    return canonical.parsed.map(normalizeItem).filter(Boolean);
  }
  const v1 = found.find((f) => f.key === "sendr_cart_v1");
  if (v1 && Array.isArray(v1.parsed) && v1.parsed.length > 0) {
    return v1.parsed.map(normalizeItem).filter(Boolean);
  }
  for (const f of found) {
    if (Array.isArray(f.parsed) && f.parsed.length > 0) {
      return f.parsed.map(normalizeItem).filter(Boolean);
    }
    if (f.parsed && typeof f.parsed === "object" && Array.isArray(f.parsed.items) && f.parsed.items.length > 0) {
      return f.parsed.items.map(normalizeItem).filter(Boolean);
    }
  }
  return [];
}

function persistCanonical(items) {
  try {
    localStorage.setItem("sendr_cart", JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to persist cart", e);
  }
}

function clearAllCartKeys() {
  try {
    for (const k of KNOWN_KEYS) localStorage.removeItem(k);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/cart/i.test(key)) keysToRemove.push(key);
    }
    for (const k of keysToRemove) localStorage.removeItem(k);
  } catch (e) {
    console.warn("Failed to clear legacy cart keys", e);
  }
}

function dispatchCartUpdated(items = []) {
  try {
    window.dispatchEvent(new CustomEvent("sendr:cart-updated", { detail: { items } }));
  } catch {
    try {
      const evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("sendr:cart-updated", true, true, { items });
      window.dispatchEvent(evt);
    } catch (e) {
      // ignore
    }
  }
}

async function validateBeforeCheckout(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty");

  for (const it of items) {
    if (!it.productId) throw new Error(`Missing product id for ${it.name || "item"}`);
    const snap = await getDoc(doc(db, "products", it.productId));
    if (!snap.exists()) throw new Error(`${it.name} no longer exists`);
    const data = snap.data();
    if (data.available === false) throw new Error(`${it.name} is unavailable`);
    const availableQty = Number(data.quantity || 0);
    if (availableQty < Number(it.qty || 0)) throw new Error(`${it.name} has only ${availableQty} left`);
  }
  return true;
}

export default function CustomerCart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load once and normalize
  useEffect(() => {
    const found = readAllCandidates();
    const normalized = canonicalize(found);
    setItems(normalized);
    persistCanonical(normalized);
  }, []);

  // persist and notify
  useEffect(() => {
    persistCanonical(items);
    dispatchCartUpdated(items);
  }, [items]);

  function updateQty(i, qty) {
    qty = Number(qty);
    if (isNaN(qty)) return;
    const next = items.slice();
    next[i] = { ...next[i], qty: qty < 1 ? 1 : qty };
    setItems(next);
  }

  function removeItem(i) {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
  }

  const subtotal = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 0)), 0);
  const delivery = subtotal === 0 ? 0 : (subtotal > 499 ? 0 : 30);
  const total = subtotal + delivery;

  async function placeOrder(paymentMethod) {
    try {
      if (items.length === 0) {
        alert("Your cart is empty");
        return;
      }

      setLoading(true);
      await validateBeforeCheckout(items);

      const orderDoc = {
        items,
        subtotal,
        delivery,
        total,
        status: "placed",
        paymentMethod,
        paymentStatus: paymentMethod === "online" ? "sample-paid" : "pending",
        createdAt: serverTimestamp(),
        // optionally add customer info if available (phone, name)
      };

      // create the order
      const docRef = await addDoc(collection(db, "orders"), orderDoc);
      const orderId = docRef.id;

      // write orderId back to the document
      try {
        await updateDoc(doc(db, "orders", orderId), { orderId });
      } catch (e) {
        // not critical if this fails
        console.warn("Failed to set orderId field:", e);
      }

      // clear cart state + localStorage keys and persist empty canonical
      setItems([]);
      clearAllCartKeys();
      persistCanonical([]);
      dispatchCartUpdated([]);

      // Show tracking link and navigate to tracking page
      const link = `${window.location.origin}/order/${orderId}`;
      alert("Order placed! Track it here: " + link);
      navigate(`/order/${orderId}`);
    } catch (err) {
      console.error("Place order failed", err);
      alert(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-semibold mb-4">Your cart</h2>

      {items.length === 0 ? (
        <div className="text-gray-600">Your cart is empty.</div>
      ) : (
        <div className="grid gap-4">
          {items.map((it, idx) => (
            <div key={it.productId || idx} className="p-3 border rounded bg-white flex items-center gap-3">
              <div className="w-20 h-20 bg-gray-100 flex items-center justify-center rounded">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-500">No image</span>
                )}
              </div>

              <div className="flex-1">
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  ₹{it.price} × {it.qty} = ₹{Number(it.price) * Number(it.qty)}
                </div>

                <div className="flex items-center mt-2 gap-2">
                  <button onClick={() => updateQty(idx, it.qty - 1)} className="px-2 py-1 border rounded" disabled={it.qty <= 1}>
                    −
                  </button>
                  <div className="px-3 py-1 border rounded">{it.qty}</div>
                  <button onClick={() => updateQty(idx, it.qty + 1)} className="px-2 py-1 border rounded">
                    +
                  </button>
                  <button onClick={() => removeItem(idx)} className="ml-4 text-red-600 text-sm">Remove</button>
                </div>
              </div>
            </div>
          ))}

          <div className="p-4 border rounded bg-white">
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Delivery</span>
              <span>₹{delivery}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <div className="flex mt-4 gap-3 flex-wrap">
              <button onClick={() => placeOrder("online")} disabled={loading} className="px-4 py-2 rounded bg-black text-white">
                {loading ? "Placing…" : "Place order (Online sample)"}
              </button>

              <button onClick={() => placeOrder("cod")} disabled={loading} className="px-4 py-2 rounded border">
                {loading ? "Placing…" : "Place order (Cash on Delivery)"}
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              This is a sample checkout — both buttons create an order document for demo purposes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

