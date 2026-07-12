import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { RefusalAlert } from "../components/RefusalAlert";
import { ArrowLeftRight, Check, X, UserMinus, UserCheck, RefreshCw } from "lucide-react";

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
  
  // Refusal Modal states
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
      targetEmp = currentUser?.id || "E-4"; // returned by current user
    }

    const res = requestHandoff(selectedAssetTag, targetEmp, type);

    if (!res.success) {
      if (res.error === "refusal") {
        // Trigger Refusal Modal
        setRefusalAssetTag(selectedAssetTag);
        setRefusalTargetEmpId(targetEmp);
        setRefusalReason(res.reason);
        setRefusalOpen(true);
      } else {
        alert(res.error || "Action failed");
      }
    } else {
      // Clear form
      setSelectedAssetTag("");
      setTargetEmployeeId("");
      alert("Handoff request logged successfully.");
    }
  };

  // Triggered from Refusal Modal when clicking "Request Transfer"
  const handleRefusalTransferRequest = () => {
    setRefusalOpen(false);
    
    // Explicitly raise transfer request
    const res = requestHandoff(refusalAssetTag, refusalTargetEmpId, "transfer");
    if (res.success) {
      alert("Transfer request raised successfully. Current holder has been notified.");
    } else {
      alert("Could not raise transfer request.");
    }
    
    setSelectedAssetTag("");
    setTargetEmployeeId("");
  };

  return (
    <div>
      
      {/* Refusal Alert Modal Popup */}
      <RefusalAlert 
        isOpen={refusalOpen}
        title="Custody Refusal"
        reason={refusalReason}
        onAction={handleRefusalTransferRequest}
        onClose={() => setRefusalOpen(false)}
      />

      <div className="grid-2" style={{ alignItems: "start" }}>
        
        {/* Left Side: Actions form Card */}
        <div className="data-table-card" style={{ padding: "24px" }}>
          
          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--hairline-2)", marginBottom: "20px", paddingBottom: "4px" }}>
            <button 
              className={`btn btn-small ${activeTab === "allocate" ? "btn-primary" : ""}`}
              onClick={() => { setActiveTab("allocate"); setSelectedAssetTag(""); setTargetEmployeeId(""); }}
              style={{ border: "none", boxShadow: "none" }}
            >
              Allocate
            </button>
            <button 
              className={`btn btn-small ${activeTab === "transfer" ? "btn-primary" : ""}`}
              onClick={() => { setActiveTab("transfer"); setSelectedAssetTag(""); setTargetEmployeeId(""); }}
              style={{ border: "none", boxShadow: "none" }}
            >
              Transfer
            </button>
            <button 
              className={`btn btn-small ${activeTab === "return" ? "btn-primary" : ""}`}
              onClick={() => { setActiveTab("return"); setSelectedAssetTag(""); setTargetEmployeeId(""); }}
              style={{ border: "none", boxShadow: "none" }}
            >
              Return
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            
            {/* Asset Selection */}
            <div className="form-group">
              <label>Select Asset</label>
              <select 
                className="form-control"
                value={selectedAssetTag}
                onChange={(e) => setSelectedAssetTag(e.target.value)}
                required
              >
                <option value="">Choose Asset...</option>
                {assets.map(asset => {
                  const holder = employees.find(e => e.id === asset.heldBy);
                  const holderText = holder ? ` (Held by ${holder.name})` : " (Available)";
                  return (
                    <option key={asset.tag} value={asset.tag}>
                      {asset.tag} — {asset.name} {holderText}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Target Employee (Only for Allocate & Transfer) */}
            {activeTab !== "return" && (
              <div className="form-group">
                <label>{activeTab === "allocate" ? "Allocate To" : "Transfer To"}</label>
                <select 
                  className="form-control"
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  required
                >
                  <option value="">Choose Recipient...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.dept})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Return details info */}
            {activeTab === "return" && (
              <div className="refusal-alert" style={{ margin: "0 0 16px 0", padding: "12px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-2)" }}>
                  <strong>Returns:</strong> The asset status will reset to <strong>Available</strong>, clearing active allocation records from its profile.
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
              {activeTab === "allocate" && <UserCheck size={16} />}
              {activeTab === "transfer" && <ArrowLeftRight size={16} />}
              {activeTab === "return" && <UserMinus size={16} />}
              <span style={{ marginLeft: "4px" }}>
                {activeTab === "allocate" && "Authorize Allocation"}
                {activeTab === "transfer" && "Request Custody Transfer"}
                {activeTab === "return" && "Process Return"}
              </span>
            </button>

          </form>
        </div>

        {/* Right Side: Flow ledger / Recent handoffs */}
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "16px" }}>
            Handoff History & Pending Approvals
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {handoffs.slice().reverse().map(handoff => {
              const asset = assets.find(a => a.tag === handoff.assetTag);
              const fromUser = employees.find(e => e.id === handoff.fromEmployeeId);
              const toUser = employees.find(e => e.id === handoff.toEmployeeId);
              const isPending = handoff.status === "requested";

              return (
                <div 
                  key={handoff.id} 
                  className={`handoff-flow-wrapper ${isPending ? "pending" : ""}`}
                  style={{ 
                    backgroundColor: "var(--surface)", 
                    borderColor: isPending ? "var(--accent)" : "var(--hairline)" 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                    
                    {/* From Actor */}
                    <div className="handoff-actor">
                      <div className="avatar">{fromUser?.avatar || "AF"}</div>
                      <span className="handoff-actor-name">{fromUser?.name || "Inventory"}</span>
                    </div>

                    {/* Arrow / Asset */}
                    <div className="handoff-connector">
                      <span className="handoff-connector-label mono" style={{ fontSize: "10px" }}>
                        {handoff.type.toUpperCase()}
                      </span>
                      <div className="handoff-line" />
                      <div style={{ marginTop: "4px" }}>
                        <StampedTag tag={handoff.assetTag} />
                      </div>
                    </div>

                    {/* To Actor */}
                    <div className="handoff-actor">
                      <div className="avatar">{toUser?.avatar}</div>
                      <span className="handoff-actor-name">{toUser?.name}</span>
                    </div>

                  </div>

                  {/* Status Indicator or approvals */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <span 
                      className="mono" 
                      style={{ 
                        fontSize: "11px", 
                        fontWeight: "600",
                        color: isPending 
                          ? "var(--accent)" 
                          : handoff.status === "approved" 
                            ? "var(--available)" 
                            : "var(--alert)" 
                      }}
                    >
                      {handoff.status.toUpperCase()}
                    </span>
                    <span className="mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                      {new Date(handoff.date).toLocaleDateString()}
                    </span>

                    {/* Interactive inline approval options for testing */}
                    {isPending && (
                      <div style={{ display: "flex", gap: "4px", marginTop: "4px", zIndex: 10 }}>
                        <button 
                          className="btn btn-small btn-primary"
                          onClick={() => approveHandoff(handoff.id)}
                          style={{ height: "22px", padding: "2px 6px", fontSize: "10px" }}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-small"
                          onClick={() => declineHandoff(handoff.id)}
                          style={{ height: "22px", padding: "2px 6px", fontSize: "10px", color: "var(--alert)", borderColor: "var(--alert)" }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
