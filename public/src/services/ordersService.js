// src/services/ordersService.js
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * updateOrderStatus(orderId, status, by)
 * - writes `status` (string) to root `status` field
 * - appends { status, by, at } to `statusHistory` array
 */
export async function updateOrderStatus(orderId, status, by = "vendor") {
  if (!orderId) throw new Error("orderId required");
  const dref = doc(db, "orders", orderId);
  await updateDoc(dref, {
    status,
    statusHistory: arrayUnion({
      status,
      by,
      at: serverTimestamp(),
    }),
  });
}

/**
 * subscribeToOrder(orderId, onChange)
 * - onChange receives the document data (or null if deleted)
 * - returns the unsubscribe function
 */
export function subscribeToOrder(orderId, onChange) {
  const dref = doc(db, "orders", orderId);
  return onSnapshot(dref, (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    const data = { id: snap.id, ...snap.data() };
    onChange(data);
  });
}

/**
 * fetchOrdersForVendor(vendorId)
 * - simple fetch. You may replace with a real-time listener if needed.
 */
export async function fetchOrdersForVendor(vendorId) {
  if (!vendorId) return [];
  const q = query(collection(db, "orders"), where("vendorId", "==", vendorId));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
}

