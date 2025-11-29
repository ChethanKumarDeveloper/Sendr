// src/pages/Customer/OrderTracking.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { subscribeToOrder } from "../../services/ordersService";

/**
 * OrderTracking page
 * - Reads order id from URL param `:id`
 * - Shows order details and real-time status history
 */

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = subscribeToOrder(id, (data) => {
      setOrder(data);
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (loading) return <div className="p-4">Loading order…</div>;
  if (!order) return <div className="p-4">Order not found.</div>;

  const history = (order.statusHistory || []).slice().sort((a, b) => {
    // Firestore Timestamps have seconds
    const ta = a.at?.seconds ? a.at.seconds : (a.at ? new Date(a.at).getTime() / 1000 : 0);
    const tb = b.at?.seconds ? b.at.seconds : (b.at ? new Date(b.at).getTime() / 1000 : 0);
    return ta - tb;
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-semibold mb-4">Order Tracking — #{order.id}</h2>

      <div className="mb-4">
        <div className="text-sm">Status: <strong>{order.status}</strong></div>
        <div className="text-sm">Total: ₹{order.total}</div>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="font-semibold mb-2">Timeline</div>
        <ol className="list-decimal pl-5">
          {history.length === 0 && <li className="text-sm text-gray-500">No status updates yet.</li>}
          {history.map((h, idx) => {
            const at = h.at?.toDate ? h.at.toDate().toLocaleString() : (h.at ? new Date(h.at.seconds * 1000).toLocaleString() : "");
            return (
              <li key={idx} className="mb-2">
                <div className="font-medium">{h.status}</div>
                <div className="text-xs text-gray-600">{h.by} — {at}</div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

