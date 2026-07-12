import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: "var(--available)",
  error: "var(--alert)",
  warning: "var(--maint)",
  info: "var(--accent)",
};

// Global, non-blocking notification stack — replaces native alert() popups,
// which freeze the UI thread and can't be styled or auto-dismissed.
export const ToastStack = () => {
  const { toasts, dismissToast } = useContext(AppContext);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 3000,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "360px",
      }}
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        const color = COLORS[toast.type] || COLORS.info;
        return (
          <div
            key={toast.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px 14px",
              borderRadius: "8px",
              backgroundColor: "var(--surface)",
              border: `1px solid ${color}`,
              boxShadow: "var(--shadow-medium, 0 4px 20px rgba(0,0,0,0.15))",
              fontSize: "13px",
              color: "var(--ink)",
              animation: "toast-in 0.2s ease-out",
            }}
          >
            <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
