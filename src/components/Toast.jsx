import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((message) => showToast(message, "success"), [showToast]);
  const error = useCallback((message) => showToast(message, "error"), [showToast]);
  const info = useCallback((message) => showToast(message, "info"), [showToast]);
  const warning = useCallback((message) => showToast(message, "warning"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alert ${
              toast.type === "success"
                ? "alert-success"
                : toast.type === "error"
                ? "alert-danger"
                : toast.type === "warning"
                ? "alert-warning"
                : "alert-info"
            } shadow-lg`}
            style={{
              minWidth: "300px",
              animation: "slideIn 0.3s ease-out",
            }}
            role="alert"
          >
            <div className="d-flex align-items-center gap-2">
              {toast.type === "success" && <i className="bi bi-check-circle-fill"></i>}
              {toast.type === "error" && <i className="bi bi-x-circle-fill"></i>}
              {toast.type === "warning" && <i className="bi bi-exclamation-triangle-fill"></i>}
              {toast.type === "info" && <i className="bi bi-info-circle-fill"></i>}
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
