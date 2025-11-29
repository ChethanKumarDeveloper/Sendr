
// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import FloatingCart from "./components/FloatingCart";

import CustomerBrowse from "./pages/Customer/CustomerBrowse";
import CustomerCart from "./pages/Customer/CustomerCart";
import OrderTracking from "./pages/Customer/OrderTracking";

/* vendor pages */
import VendorLanding from "./pages/Vendor/VendorLanding";
import VendorRegister from "./pages/Vendor/VendorRegister";
import VendorLogin from "./pages/Vendor/VendorLogin";
import VendorDashboard from "./pages/Vendor/VendorDashboard";
import AddProduct from "./pages/Vendor/AddProduct";
import VendorOrders from "./pages/Vendor/VendorOrders";
import ProtectedVendorRoute from "./components/ProtectedVendorRoute";
import EditProduct from "./pages/Vendor/EditProduct";
/*import VendorOrders from "./pages/Vendor/VendorOrders";



/* ---------------------------
   Footer
--------------------------- */
function Footer() {
  return (
    <footer className="mt-auto bg-white border-t">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
        <div>© <strong>Sendr</strong> — Shop next door, instantly.</div>
        <div className="mt-3 sm:mt-0">
          <a className="mr-4 hover:text-brand-600" href="#">About</a>
          <a className="mr-4 hover:text-brand-600" href="#">Contact</a>
          <a className="mr-4 hover:text-brand-600" href="/vendor">Vendor</a>
          <a className="hover:text-brand-600" href="#">Privacy</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------
   Location Modal
--------------------------- */
function LocationModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState("");

  function allowLocation() {
    if (!("geolocation" in navigator)) {
      alert("Geolocation not supported.");
      return;
    }
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.dispatchEvent(
          new CustomEvent("sendr:location", {
            detail: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          })
        );
        setLoading(false);
        onClose();
      },
      (err) => {
        console.error("Geo error", err);
        setLoading(false);
        alert("Failed to get location. Try again or enter pincode.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function usePincode() {
    if (!pincode || pincode.length < 3) {
      alert("Enter a valid pincode.");
      return;
    }
    window.dispatchEvent(
      new CustomEvent("sendr:pincode", { detail: { pincode } })
    );
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-xl font-semibold mb-2">Enable location</h3>
        <p className="text-sm text-gray-600 mb-4">
          To show nearby shops, allow your location or enter pincode.
        </p>

        <button
          onClick={allowLocation}
          disabled={loading}
          className="w-full bg-brand-500 text-white py-3 rounded-md font-semibold"
        >
          {loading ? "Locating…" : "Allow Location"}
        </button>

        <div className="flex items-center gap-2 mt-3">
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Enter pincode"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button
            onClick={usePincode}
            className="px-4 py-2 bg-gray-100 rounded-md"
          >
            Use
          </button>
        </div>

        <div className="mt-3 text-right">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   AppShell
--------------------------- */
function AppShell({ children, searchValue, setSearchValue }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <section className="bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Groceries & essentials from shops near you
            </h1>

            <p className="mt-4 text-gray-600 max-w-2xl">
              Fast deliveries from neighborhood stores — groceries, dairy,
              snacks and more.
            </p>

            {/* HERO SEARCH (only search bar in the app) */}
            <div className="mt-8 w-full max-w-2xl">
              <div className="flex gap-3">
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products or shops (e.g. tomatoes, milk)"
                  className="flex-1 rounded-full border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
                <button className="px-4 py-3 bg-brand-500 text-white rounded-full font-semibold">
                  Search
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Showing shops within <strong>1–5 km</strong> of your location.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1">
        {children}
      </main>

      <FloatingCart />
      <Footer />
    </div>
  );
}

/* ---------------------------
   Main App
--------------------------- */
export default function App() {
  const [searchValue, setSearchValue] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("sendr:seen_location_modal");
    if (seen === "true") setShowLocationModal(false);
  }, []);

  function closeModal() {
    try { localStorage.setItem("sendr:seen_location_modal", "true"); } catch {}
    setShowLocationModal(false);
  }

  return (
    <Router>
      <AppShell searchValue={searchValue} setSearchValue={setSearchValue}>
        <Routes>
          <Route path="/" element={<CustomerBrowse search={searchValue} />} />
          <Route path="/cart" element={<CustomerCart />} />

          {/* vendor routes */}
          <Route path="/vendor" element={<VendorLanding />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedVendorRoute>
                <VendorDashboard />
              </ProtectedVendorRoute>
            }
          />
          <Route
            path="/vendor/add"
            element={
              <ProtectedVendorRoute>
                <AddProduct />
              </ProtectedVendorRoute>
            }
          />
          <Route
            path="/vendor/orders"
            element={
              <ProtectedVendorRoute>
                <VendorOrders />
              </ProtectedVendorRoute>
            }
          />

          <Route
  path="/vendor/edit/:id"
  element={
    <ProtectedVendorRoute>
      <EditProduct />
    </ProtectedVendorRoute>
  }
/>
<Route path="/vendor/orders" element={<VendorOrders />} />
<Route path="/order/:id" element={<OrderTracking />} />



          <Route path="*" element={<div className="p-4">Page not found</div>} />
        </Routes>

        <LocationModal open={showLocationModal} onClose={closeModal} />
      </AppShell>
    </Router>
  );
}
