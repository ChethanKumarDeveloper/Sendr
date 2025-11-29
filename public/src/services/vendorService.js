
// src/services/vendorService.js
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

export async function getVendor(uid) {
  const d = await getDoc(doc(db, "vendors", uid));
  return d.exists() ? d.data() : null;
}

export async function createShop(shop) {
  return await addDoc(collection(db, "shops"), shop);
}

export async function setVendorProfile(uid, data) {
  return await setDoc(doc(db, "vendors", uid), data);
}
