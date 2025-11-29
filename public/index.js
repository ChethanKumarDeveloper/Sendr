// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

/**
 * Lightweight Error Boundary so accidental runtime errors
 * show a friendly UI instead of a blank page.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log this to an external service later
    console.error("Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#fff"
        }}>
          <div style={{ maxWidth: 720, textAlign: "center" }}>
            <h1 style={{ marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: "#555", marginBottom: 12 }}>
              The app encountered an error. Please reload the page or try again later.
            </p>
            <pre style={{
              textAlign: "left",
              background: "#f6f6f6",
              padding: 12,
              borderRadius: 6,
              maxHeight: 240,
              overflow: "auto"
            }}>
              {this.state.error && String(this.state.error)}
            </pre>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => window.location.reload()} style={{
                padding: "10px 16px",
                borderRadius: 6,
                border: "none",
                background: "#18A14A",
                color: "#fff",
                cursor: "pointer"
              }}>
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Ensure there's a root container to mount into
const container = document.getElementById("root");
if (!container) {
  // Helpful message — most common cause of "nothing renders"
  console.error("React root element not found. Make sure public/index.html contains <div id=\"root\"></div>");
} else {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
