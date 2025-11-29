// src/pages/Vendor/VendorOrders.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { updateOrderStatus } from "../../services/ordersService";

/**
 * VendorOrders (updated)
 *
 * - Real-time list of orders (filtered by vendorId if available)
 * - Per-order button loading + confirmation for reject
 * - Uses updateOrderStatus(orderId, status, by)
 * - Shows "Copy tracking link" + "Open tracking page"
 *
 * NOTE: Replace window.vendorId with real vendor auth when ready.
 */

const ACTIONS = [
  { key: "accepted", label: "Accept" },
  { key: "rejected", label: "Reject" },
  { key: "packed", label: "Mark Packed" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // per-order loading map: { [orderId]: true/false }
  const [opLoading, setOpLoading] = useState({});

  // Replace this by real vendor auth / profile
  const vendorId = window.vendorId || null;

  useEffect(() => {
    let unsub = () => {};
    if (vendorId) {
      const q = query(collection(db, "orders"), where("vendorId", "==", vendorId));
      unsub = onSnapshot(q, (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    } else {
      // fallback: subscribe to all orders (filter client-side if needed)
      const q = query(collection(db, "orders"));
      unsub = onSnapshot(q, (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    }
    return () => unsub();
  }, [vendorId]);

  function setOrderLoading(orderId, val) {
    setOpLoading(prev => ({ ...prev, [orderId]: val }));
  }

  async function handleAction(orderId, actionKey) {
    const confirmReject = actionKey === "rejected" ? window.confirm("Are you sure you want to reject this order?") : true;
    if (!confirmReject) return;

    try {
      setOrderLoading(orderId, true);
      await updateOrderStatus(orderId, actionKey, "vendor");
      // optional: tiny toast
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status: " + (err.message || ""));
    } finally {
      setOrderLoading(orderId, false);
    }
  }

  function formatTimestamp(ts) {
    if (!ts) return "";
    // Firestore Timestamp => has toDate()
    if (typeof ts.toDate === "function") {
      try {
        return ts.toDate().toLocaleString();
      } catch { /* fallthrough */ }
    }
    // fallback: seconds property
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    // last resort
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  }

  function trackingUrl(orderId) {
    return `${window.location.origin}/order/${orderId}`;
  }

  if (loading) return <div className="p-4">Loading orders…</div>;
  if (!orders.length) return <div className="p-4">No orders yet.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Vendor Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded p-3 bg-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <div className="font-semibold">Order #{order.id}</div>
                <div className="text-sm text-gray-600">Status: <strong>{order.status || "placed"}</strong></div>
                <div className="text-xs text-gray-500 mt-1">Total: ₹{order.total}</div>
                <div className="text-xs text-gray-500">Customer: {order.customerPhone || order.customerName || "—"}</div>
                <div className="text-xs text-gray-500">Placed: {formatTimestamp(order.createdAt)}</div>
              </div>

              <div className="flex items-center gap-2">
                {ACTIONS.map((act) => (
                  <button
                    key={act.key}
                    onClick={() => handleAction(order.id, act.key)}
                    className="px-3 py-1 rounded border text-sm"
                    disabled={Boolean(opLoading[order.id])}
                    title={act.label}
                  >
                    {opLoading[order.id] && act.key ? "…" : act.label}
                  </button>
                ))}

                <button
                  onClick={() => {
                    const link = trackingUrl(order.id);
                    try {
                      navigator.clipboard.writeText(link);
                      alert("Tracking link copied to clipboard");
                    } catch {
                      prompt("Copy this link:", link);
                    }
                  }}
                  className="px-3 py-1 rounded border text-sm"
                >
                  Copy link
                </button>

                <a
                  className="px-3 py-1 rounded border text-sm bg-gray-50"
                  href={trackingUrl(order.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open tracking
                </a>
              </div>
            </div>

            {/* items */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(order.items || []).map((it, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-100 flex items-center justify-center rounded">
                    {it.imageUrl ? (
                      <img src={it.imageUrl} alt={it.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-500">No image</span>
                    )}
                  </div>

                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.qty} × ₹{it.price}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* status history */}
            <div className="mt-3 text-xs">
              <div className="font-semibold">History</div>
              <ul className="list-disc pl-5">
                {(order.statusHistory || []).slice().reverse().map((h, i) => (
                  <li key={i}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium">{h.status}</span>
                        <span className="ml-2 text-gray-600">— {h.by}</span>
                      </div>
                      <div className="text-gray-500 text-xs">{formatTimestamp(h.at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

