import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { RefusalAlert } from "../components/RefusalAlert";
import { 
  ArrowLeftRight, Check, X, UserMinus, UserCheck, RefreshCw, 
  Search, UserSearch, ArrowDown, Ban, Package 
} from "lucide-react";

export const Handoffs = () => {
  const { 
    assets, 
    employees, 
    handoffs, 
    requestHandoff, 
    approveHandoff, 
    declineHandoff,
    currentUser 
  } = useContext(AppContext);

  // Form states
  const [activeTab, setActiveTab] = useState("allocate"); // allocate, transfer, return
  const [selectedAssetTag, setSelectedAssetTag] = useState("");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  
  // Inline Refusal state (shown below allocate form, not modal)
  const [inlineRefusal, setInlineRefusal] = useState(null);
  
  // Refusal Modal states (kept for backward compat)
  const [refusalOpen, setRefusalOpen] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");
  const [refusalAssetTag, setRefusalAssetTag] = useState("");
  const [refusalTargetEmpId, setRefusalTargetEmpId] = useState("");

  const isManagerOrAdmin = ["Admin", "Manager"].includes(currentUser?.role);

  // Submit handoff request
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAssetTag) return;

    let type = "allocation";
    let targetEmp = targetEmployeeId;

    if (activeTab === "transfer") {
      type = "transfer";
    } else if (activeTab === "return") {
      type = "return";
      targetEmp = currentUser?.id || "E-4";
    }

    const res = requestHandoff(selectedAssetTag, targetEmp, type);

    if (!res.success) {
      if (res.error === "refusal") {
        // Show inline refusal card instead of modal
        const asset = assets.find(a => a.tag === selectedAssetTag);
        const holder = asset?.heldBy ? employees.find(e => e.id === asset.heldBy) : null;
        
        setInlineRefusal({
          assetTag: selectedAssetTag,
          targetEmpId: targetEmp,
          reason: res.reason,
          holderName: holder?.name || "Unknown",
          holderDept: holder?.dept || "",
        });
      } else {
        alert(res.error || "Action failed");
      }
    } else {
      setSelectedAssetTag("");
      setTargetEmployeeId("");
      setInlineRefusal(null);
      alert("Handoff request logged successfully.");
    }
  };

  // Triggered from inline refusal "Request Transfer" button
  const handleInlineTransferRequest = () => {
    if (!inlineRefusal) return;
    
    const res = requestHandoff(inlineRefusal.assetTag, inlineRefusal.targetEmpId, "transfer");
    if (res.success) {
      alert("Transfer request raised successfully. Current holder has been notified.");
    } else {
      alert("Could not raise transfer request.");
    }
    
    setInlineRefusal(null);
    setSelectedAssetTag("");
    setTargetEmployeeId("");
  };

  // Count actionable (pending) handoffs
  const pendingHandoffs = handoffs.filter(h => h.status === "requested");
  const completedHandoffs = handoffs.filter(h => h.status !== "requested");

  // Get asset icon based on category (simple lookup)
  const getAssetIcon = (assetTag) => {
    return <Package size={18} />;
  };

  // Tab config
  const tabs = [
    { key: "allocate", label: "Allocate", icon: UserCheck },
    { key: "transfer", label: "Transfer", icon: ArrowLeftRight },
    { key: "return", label: "Return", icon: UserMinus },
  ];

  return (
    <div>
      {/* Refusal Alert Modal (fallback) */}
      <RefusalAlert 
        isOpen={refusalOpen}
        title="Custody Refusal"
        reason={refusalReason}
        onAction={() => {
          setRefusalOpen(false);
          const res = requestHandoff(refusalAssetTag, refusalTargetEmpId, "transfer");
          if (res.success) alert("Transfer request raised.");
          setSelectedAssetTag("");
          setTargetEmployeeId("");
        }}
        onClose={() => setRefusalOpen(false)}
      />

      {/* Page Header */}
      <div className="handoffs-page-header">
        <h2>Transfers & Returns</h2>
        <p>Chain of custody execution · Strict adherence required</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "380px 1fr", alignItems: "start" }}>
        
        {/* ===== LEFT COLUMN: Allocate Form + Inline Refusal ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Allocate Section Card */}
          <section className="allocate-section">
            <div className="allocate-section-header">
              <h3>
                {activeTab === "allocate" && "Allocate"}
                {activeTab === "transfer" && "Transfer"}
                {activeTab === "return" && "Return"}
              </h3>
              <span>New Transaction</span>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
              {tabs.map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button 
                    key={tab.key}
                    onClick={() => { 
                      setActiveTab(tab.key); 
                      setSelectedAssetTag(""); 
                      setTargetEmployeeId(""); 
                      setInlineRefusal(null);
                    }}
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: isActive ? "700" : "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      background: isActive ? "var(--accent-soft)" : "transparent",
                      color: isActive ? "var(--accent)" : "var(--text-3)",
                      border: "1px solid",
                      borderColor: isActive ? "var(--accent)" : "transparent",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <TabIcon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Target Object */}
              <div style={{ marginBottom: "4px" }}>
                <label className="form-group label" style={{ 
                  display: "block", fontSize: "10px", fontWeight: "600", 
                  textTransform: "uppercase", color: "var(--text-3)", 
                  marginBottom: "4px", letterSpacing: "0.06em" 
                }}>
                  Target Object
                </label>
                <div className="allocate-search-input">
                  <Search size={16} />
                  <select 
                    value={selectedAssetTag}
                    onChange={(e) => { setSelectedAssetTag(e.target.value); setInlineRefusal(null); }}
                    required
                  >
                    <option value="">Scan or enter Asset ID...</option>
                    {assets.map(asset => {
                      const holder = employees.find(e => e.id === asset.heldBy);
                      const holderText = holder ? ` → ${holder.name}` : " (Available)";
                      return (
                        <option key={asset.tag} value={asset.tag}>
                          {asset.tag} — {asset.name}{holderText}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Directional Arrow */}
              {activeTab !== "return" && (
                <div className="allocate-direction-arrow">
                  <ArrowDown size={20} />
                </div>
              )}

              {/* Target Employee (for Allocate & Transfer) */}
              {activeTab !== "return" && (
                <div style={{ marginBottom: "4px" }}>
                  <label style={{ 
                    display: "block", fontSize: "10px", fontWeight: "600", 
                    textTransform: "uppercase", color: "var(--text-3)", 
                    marginBottom: "4px", letterSpacing: "0.06em" 
                  }}>
                    {activeTab === "allocate" ? "Receiving Custodian" : "Transfer To"}
                  </label>
                  <div className="allocate-search-input">
                    <UserSearch size={16} />
                    <select 
                      value={targetEmployeeId}
                      onChange={(e) => setTargetEmployeeId(e.target.value)}
                      required
                    >
                      <option value="">Search directory...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.dept})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Return info box */}
              {activeTab === "return" && (
                <div style={{ 
                  backgroundColor: "var(--fill)", 
                  padding: "12px", 
                  borderRadius: "4px", 
                  fontSize: "12px", 
                  color: "var(--text-2)", 
                  border: "1px solid var(--hairline)",
                  marginTop: "12px",
                  lineHeight: "1.5"
                }}>
                  <strong>Returns:</strong> The asset status will reset to <strong>Available</strong>, clearing active allocation records from its profile.
                </div>
              )}

              {/* CTA Button */}
              <button type="submit" className="allocate-cta">
                {activeTab === "allocate" && <UserCheck size={14} />}
                {activeTab === "transfer" && <ArrowLeftRight size={14} />}
                {activeTab === "return" && <UserMinus size={14} />}
                <span>
                  {activeTab === "allocate" && "Initiate Transfer"}
                  {activeTab === "transfer" && "Request Custody Transfer"}
                  {activeTab === "return" && "Process Return"}
                </span>
              </button>
            </form>
          </section>

          {/* ===== INLINE REFUSAL CARD ===== */}
          {inlineRefusal && (
            <div className="inline-refusal-card">
              <div className="inline-refusal-hatch" />
              <div className="inline-refusal-content">
                <div className="inline-refusal-header">
                  <h4>
                    <Ban size={16} />
                    Allocation Blocked
                  </h4>
                  <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="inline-refusal-quote">
                  Asset <strong>{inlineRefusal.assetTag}</strong> is currently held by <strong>{inlineRefusal.holderName} ({inlineRefusal.holderDept})</strong>.
                </div>
                <p className="inline-refusal-detail">
                  Direct allocation is disabled while an active custodian exists. You must request a transfer from the current holder.
                </p>
                <button 
                  className="inline-refusal-action"
                  onClick={handleInlineTransferRequest}
                >
                  Request Transfer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT COLUMN: Pending Authorization + History ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Pending Authorization Header */}
          <div className="pending-auth-header">
            <h3>Pending Authorization</h3>
            <span className="pending-auth-badge">
              {pendingHandoffs.length} Actionable
            </span>
          </div>

          {/* ===== CUSTODY FLOW CARDS ===== */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {handoffs.slice().reverse().map((handoff, idx) => {
              const asset = assets.find(a => a.tag === handoff.assetTag);
              const fromUser = employees.find(e => e.id === handoff.fromEmployeeId);
              const toUser = employees.find(e => e.id === handoff.toEmployeeId);
              const isPending = handoff.status === "requested";
              const isApproved = handoff.status === "approved";
              const isDeclined = handoff.status === "declined";

              // Status badge class
              const badgeClass = isPending ? "pending" : isApproved ? "approved" : "declined";
              const badgeLabel = isPending ? "Pending" : isApproved ? "Approved" : "Declined";

              // Card class
              const cardClass = [
                "custody-flow-card",
                isPending ? "pending" : "",
                !isPending ? "dimmed" : "",
              ].filter(Boolean).join(" ");

              return (
                <div key={handoff.id} className={cardClass}>
                  {/* Top Row: ID + Status Badge */}
                  <div className="custody-flow-top">
                    <span className="custody-flow-id">
                      T-REQ-{String(handoff.id).padStart(4, "0")}
                    </span>
                    <span className={`stamp-badge ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Visual Custody Line */}
                  <div className="custody-visual-line">
                    {/* Connector Track */}
                    <div className="custody-connector-track" />

                    {/* Origin Person */}
                    <div className="custody-person-node">
                      <div className="custody-avatar">
                        {fromUser?.avatar || "AF"}
                      </div>
                      <span className="custody-person-name">
                        {fromUser?.name || "Inventory"}
                      </span>
                      <span className="custody-person-dept">
                        {fromUser?.dept || "System"}
                      </span>
                    </div>

                    {/* Center Asset Plate */}
                    <div className="custody-asset-plate">
                      {getAssetIcon(handoff.assetTag)}
                      <div className="custody-asset-tag">
                        {handoff.assetTag}
                      </div>
                    </div>

                    {/* Destination Person */}
                    <div className="custody-person-node">
                      {toUser ? (
                        <>
                          <div className="custody-avatar">
                            {toUser.avatar}
                          </div>
                          <span className="custody-person-name">
                            {toUser.name}
                          </span>
                          <span className="custody-person-dept">
                            {toUser.dept}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="custody-avatar unverified">?</div>
                          <span className="custody-person-name" style={{ opacity: 0.5 }}>
                            Unverified
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Type Label */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-3)",
                  }}>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {handoff.type}
                    </span>
                    <span>
                      {new Date(handoff.date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Row (only for pending) */}
                  {isPending && (
                    <div className="custody-action-row">
                      <button 
                        className="custody-action-btn reject"
                        onClick={() => declineHandoff(handoff.id)}
                      >
                        <X size={14} />
                        Reject
                      </button>
                      <button 
                        className="custody-action-btn approve"
                        onClick={() => approveHandoff(handoff.id)}
                      >
                        <Check size={14} />
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
