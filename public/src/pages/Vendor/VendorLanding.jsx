// src/pages/Vendor/VendorLanding.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function VendorLanding() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold mb-4">Vendor / Shop dashboard</h2>
      <p className="text-gray-600 mb-6">
        Register your shop or login to manage products and orders.
      </p>

      <div className="flex gap-4">
        <Link to="/vendor/register" className="px-4 py-3 bg-brand-500 text-white rounded shadow">Register</Link>
        <Link to="/vendor/login" className="px-4 py-3 border rounded">Login</Link>
      </div>
    </div>
  );
}

