import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { Plus, ArrowRight, Check, X } from "lucide-react";

export const Care = () => {
  const {
    careTickets,
    assets,
    employees,
    addCareTicket,
    updateCareTicketStatus,
    currentUser,
    pushToast
  } = useContext(AppContext);

  // States
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedAssetTag, setSelectedAssetTag] = useState("");
  const [issueText, setIssueText] = useState("");
  const [priority, setPriority] = useState("normal");
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Only asset_manager may progress a maintenance ticket through the workflow server-side.
  const canProgressTickets = currentUser?.roleRaw === "asset_manager";

  // Submit Care ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!selectedAssetTag || !issueText) return;

    setSubmittingTicket(true);
    const res = await addCareTicket({
      assetTag: selectedAssetTag,
      issue: issueText,
      priority
    }, issuePhoto);
    setSubmittingTicket(false);

    if (!res.success) return;

    pushToast("Maintenance ticket raised — status set to Pending.", "success");
    setSelectedAssetTag("");
    setIssueText("");
    setPriority("normal");
    setIssuePhoto(null);
    setShowReportForm(false);
  };

  // Kanban column titles & keys
  const columns = [
    { key: "pending", label: "Pending" },
    { key: "assigned", label: "Assigned" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" }
  ];

  // Helper to trigger status updates via buttons
  const moveTicket = (ticketId, currentStatus, direction) => {
    const statuses = ["pending", "assigned", "in_progress", "resolved"];
    const idx = statuses.indexOf(currentStatus);
    let nextIdx = idx;
    
    if (direction === "forward" && idx < statuses.length - 1) {
      nextIdx = idx + 1;
    } else if (direction === "backward" && idx > 0) {
      nextIdx = idx - 1;
    }

    if (nextIdx !== idx) {
      const nextStatus = statuses[nextIdx];
      // If moving to assigned, set current user as assignee for demo purposes
      const assignee = nextStatus === "assigned" ? currentUser.id : null;
      updateCareTicketStatus(ticketId, nextStatus, assignee);
    }
  };

  return (
    <div>
      
      {/* Care Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: "600" }}>Maintenance Operations</h3>
          <p style={{ fontSize: "12px", color: "var(--text-3)" }}>Diagnose and repair faulty organizational hardware.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowReportForm(true)}>
          <Plus size={14} />
          <span>Report Faulty Asset</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map(col => {
          const colTickets = careTickets.filter(t => t.status === col.key);

          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <span>{col.label}</span>
                <span className="mono" style={{ color: "var(--text-3)" }}>{colTickets.length}</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "350px" }}>
                {colTickets.length === 0 ? (
                  <div style={{ padding: "24px 12px", textAlign: "center", border: "1px dashed var(--hairline)", borderRadius: "4px", color: "var(--text-3)", fontSize: "11px" }}>
                    No tickets
                  </div>
                ) : (
                  colTickets.map(ticket => {
                    const asset = assets.find(a => a.tag === ticket.assetTag);
                    const assignee = employees.find(e => e.id === ticket.assigneeId);
                    
                    return (
                      <div key={ticket.id} className="care-ticket-card">
                        
                        {/* Priority stamp */}
                        <span className={`care-ticket-priority ${ticket.priority}`}>
                          {ticket.priority}
                        </span>

                        <div className="care-ticket-title">
                          {ticket.issue}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <StampedTag tag={ticket.assetTag} />
                            <span style={{ fontSize: "10.5px", color: "var(--text-3)" }}>{asset?.name}</span>
                          </div>

                          {assignee && (
                            <div className="avatar" style={{ width: "20px", height: "20px", fontSize: "8px" }} title={`Assigned to ${assignee.name}`}>
                              {assignee.avatar}
                            </div>
                          )}
                        </div>

                        {/* Control buttons for moving ticket along column.
                            Backward moves have no backend equivalent (one-way workflow),
                            so only the forward action is offered, and only to asset managers. */}
                        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--hairline-2)", marginTop: "12px", paddingTop: "8px" }}>
                          {col.key !== "resolved" ? (
                            canProgressTickets ? (
                              <button
                                className="btn btn-small"
                                onClick={() => moveTicket(ticket.id, ticket.status, "forward")}
                                style={{ border: "none", background: "none", padding: "4px", color: "var(--accent)" }}
                                title="Advance state"
                              >
                                <span>Next</span>
                                <ArrowRight size={13} />
                              </button>
                            ) : (
                              <span style={{ fontSize: "10px", color: "var(--text-3)", fontStyle: "italic" }}>
                                Asset manager action
                              </span>
                            )
                          ) : ticket.statusRaw === "rejected" ? (
                            <span className="mono" style={{ fontSize: "10px", color: "var(--alert)", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
                              <X size={10} /> Rejected
                            </span>
                          ) : (
                            <span className="mono" style={{ fontSize: "10px", color: "var(--available)", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
                              <Check size={10} /> Resolved
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Report Asset Fault Modal popup */}
      {showReportForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Report Faulty Asset</h3>
              <button type="button" onClick={() => setShowReportForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitTicket}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label>Select Asset</label>
                  <select 
                    className="form-control"
                    value={selectedAssetTag}
                    onChange={(e) => setSelectedAssetTag(e.target.value)}
                    required
                  >
                    <option value="">Choose Asset...</option>
                    {assets.map(asset => (
                      <option key={asset.tag} value={asset.tag}>
                        {asset.tag} — {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority (Urgent repair)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Describe the Fault / Issue</label>
                  <textarea 
                    className="form-control"
                    rows="4"
                    value={issueText}
                    onChange={(e) => setIssueText(e.target.value)}
                    placeholder="e.g. Device does not turn on. Battery swelling reported. Charging cable frayed."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Upload Diagnostic Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    style={{ fontSize: "11px" }}
                    onChange={(e) => setIssuePhoto(e.target.files?.[0] || null)}
                  />
                  {issuePhoto && (
                    <span style={{ fontSize: "10.5px", color: "var(--text-3)", marginTop: "4px", display: "block" }}>
                      {issuePhoto.name} ({Math.round(issuePhoto.size / 1024)} KB)
                    </span>
                  )}
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowReportForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingTicket}>
                  {submittingTicket ? "Submitting…" : "Submit Maintenance Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
