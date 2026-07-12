import React, { useState } from "react";

export const ConsequenceGate = ({ 
  isOpen, 
  title = "Consequence Gate", 
  warningMessage = "You are performing an action with high operational gravity.",
  affectedItems = [], 
  affectedPeople = [],
  confirmText = "CONFIRM", 
  onConfirm, 
  onClose 
}) => {
  const [reason, setReason] = useState("");
  const [verificationInput, setVerificationInput] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("You must provide a documented business reason.");
      return;
    }

    if (verificationInput !== confirmText) {
      setError(`Please type "${confirmText}" exactly to authorize.`);
      return;
    }

    onConfirm(reason);
    setReason("");
    setVerificationInput("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content consequence-gate">
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: "var(--alert)" }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: "18px" }}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="consequence-warning-box">
              {warningMessage}
            </div>

            {/* Affected Assets details */}
            {affectedItems.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: "6px" }}>
                  Resources Affected ({affectedItems.length}):
                </span>
                <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--text-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {affectedItems.map(item => (
                    <li key={item.tag}>
                      <span className="mono" style={{ color: "var(--accent)" }}>{item.tag}</span> — {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Affected People details */}
            {affectedPeople.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: "6px" }}>
                  Stakeholders Impacted:
                </span>
                <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--text-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {affectedPeople.map((person, idx) => (
                    <li key={idx}>
                      {person.name} ({person.dept})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div style={{ color: "var(--alert)", fontSize: "12px", marginBottom: "12px", fontWeight: "500" }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Reason for Authorization</label>
              <textarea 
                className="form-control" 
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Asset verified as physically destroyed. Initiating write-off checklist."
                required
              />
            </div>

            <div className="form-group">
              <label>Security Verification (Type "{confirmText}")</label>
              <input 
                type="text" 
                className="form-control mono"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                placeholder={confirmText}
                required
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              Authorize Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
