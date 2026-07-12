import React from "react";

export const RefusalAlert = ({ isOpen, title = "Allocation Refusal", reason = "", actionLabel = "Request Transfer", onAction, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ borderTop: "3px solid var(--text-2)" }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: "18px" }}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="refusal-alert" style={{ margin: 0 }}>
            <div className="refusal-alert-content" style={{ width: "100%" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>Conflict Detected</h4>
              <p style={{ margin: "6px 0 16px 0", fontSize: "13px", color: "var(--text-2)", lineHeight: "1.5" }}>
                {reason || "This asset is already allocated and cannot be directly assigned."}
              </p>
              
              <div style={{ backgroundColor: "var(--fill)", padding: "10px 12px", borderRadius: "4px", fontSize: "12px", border: "1px solid var(--hairline)" }}>
                <strong>Forward Move:</strong> Raising a transfer request will notify the current holder to release and vouch for the item.
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            Close
          </button>
          {onAction && (
            <button className="btn btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
