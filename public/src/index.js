// src/index.js
import React from "react";
import { createRoot } from "react-dom/client"; // React 18+
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css"; // adjust or remove if your CSS path differs

// Ensure public/index.html contains: <div id="root"></div>
const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found. Make sure public/index.html has <div id="root"></div>');
}

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
