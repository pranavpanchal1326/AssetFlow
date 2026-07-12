import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { AlertCircle, ArrowRight, Check, X } from "lucide-react";

export const Now = () => {
  const { 
    currentUser, 
    assets, 
    handoffs, 
    employees, 
    approveHandoff, 
    declineHandoff 
  } = useContext(AppContext);

  // Live timer for live duration ticking
  const [timeTicker, setTimeTicker] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  // Filter items in my hands
  const myAssets = assets.filter(a => a.heldBy === currentUser.id);

  // Find overdue assets (heat-ordered alerts)
  // Let's also include assets in "alert" state globally for manager/admin visibility
  const isManagerOrAdmin = ["Admin", "Manager"].includes(currentUser.role);
  const overdueAssets = assets.filter(a => {
    if (isManagerOrAdmin) {
      return a.status === "alert" || a.overdueSince;
    }
    return (a.heldBy === currentUser.id) && (a.status === "alert" || a.overdueSince);
  });

  // Approvals waiting on me (frozen mid-air transfers)
  // Admin/Manager handles all. Employees only handle transfers *from* them.
  const myHandoffsWaiting = handoffs.filter(h => {
    if (h.status !== "requested") return false;
    
    // Returns or Allocations: admin/manager approves
    if (h.type === "allocation" || h.type === "return") {
      return isManagerOrAdmin;
    }
    // Transfers: current holder must approve first
    if (h.type === "transfer") {
      return h.fromEmployeeId === currentUser.id;
    }
    return false;
  });

  // Helper to format live durations
  const formatLiveDuration = (startDateStr, isOverdue = false) => {
    if (!startDateStr) return "0s";
    const start = new Date(startDateStr);
    const diff = Math.abs(timeTicker.getTime() - start.getTime());
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const prefix = isOverdue ? "Overdue by: " : "Held for: ";
    
    if (days > 0) {
      return `${prefix}${days}d ${hours}h ${mins}m ${secs}s`;
    }
    if (hours > 0) {
      return `${prefix}${hours}h ${mins}m ${secs}s`;
    }
    return `${prefix}${mins}m ${secs}s`;
  };

  // KPI Calculations
  const totalAssetsCount = assets.length;
  const allocatedAssetsCount = assets.filter(a => a.status === "allocated").length;
  const maintenanceAssetsCount = assets.filter(a => a.status === "maint").length;
  const myAssetsValue = myAssets.reduce((sum, a) => sum + (a.cost || 0), 0);

  return (
    <div>
      {/* 1. Hot Band (Overdue / Conflict) - DISAPPEARS WHEN EMPTY */}
      {overdueAssets.length > 0 && (
        <div className="hot-band">
          <div className="hot-band-header">
            <AlertCircle size={16} />
            <span>Operational Alerts — Action Required</span>
          </div>
          <div className="hot-band-list">
            {overdueAssets.map(asset => {
              const holder = employees.find(e => e.id === asset.heldBy);
              return (
                <div key={asset.tag} className="hot-band-item">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <StampedTag tag={asset.tag} />
                    <span style={{ fontWeight: "500" }}>{asset.name}</span>
                    <span className="mono" style={{ fontSize: "11px", color: "var(--text-3)" }}>
                      ({asset.serial})
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-2)" }}>
                      {holder ? `In hands of ${holder.name}` : "Unheld"}
                    </span>
                    <span className="custody-duration overdue mono">
                      {formatLiveDuration(asset.overdueSince || "2026-07-05T18:00:00Z", true)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Approvals / Frozen Handoffs */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "16px" }}>
          Waiting on Me — Custody in Suspension
        </h3>
        
        {myHandoffsWaiting.length === 0 ? (
          <div className="refusal-alert" style={{ backgroundColor: "var(--surface)" }}>
            <div className="refusal-alert-content">
              <h4>All clear</h4>
              <p style={{ margin: 0 }}>No pending approvals or frozen custody handoffs require your authorization right now.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {myHandoffsWaiting.map(handoff => {
              const asset = assets.find(a => a.tag === handoff.assetTag);
              const fromUser = employees.find(e => e.id === handoff.fromEmployeeId);
              const toUser = employees.find(e => e.id === handoff.toEmployeeId);
              
              return (
                <div key={handoff.id} className="handoff-flow-wrapper pending">
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                    
                    {/* Handoff direction layout */}
                    <div className="handoff-actor">
                      <div className="avatar">{fromUser?.avatar || "AF"}</div>
                      <span className="handoff-actor-name">{fromUser?.name || "Inventory"}</span>
                    </div>

                    <div className="handoff-connector">
                      <span className="handoff-connector-label mono">{handoff.type.toUpperCase()}</span>
                      <div className="handoff-line" />
                      <div style={{ marginTop: "4px" }}>
                        <StampedTag tag={handoff.assetTag} />
                      </div>
                    </div>

                    <div className="handoff-actor">
                      <div className="avatar">{toUser?.avatar}</div>
                      <span className="handoff-actor-name">{toUser?.name}</span>
                    </div>

                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", zIndex: 20 }}>
                    <button 
                      className="btn btn-small btn-primary"
                      onClick={() => approveHandoff(handoff.id)}
                      title="Approve custody transfer"
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>
                    <button 
                      className="btn btn-small"
                      onClick={() => declineHandoff(handoff.id)}
                      title="Decline and return to holder"
                      style={{ color: "var(--alert)", borderColor: "var(--alert)" }}
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. In My Hands (Custody Lines) */}
      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "16px" }}>
          In My Hands — Active Custody
        </h3>

        {myAssets.length === 0 ? (
          <div className="refusal-alert" style={{ backgroundColor: "var(--surface)" }}>
            <div className="refusal-alert-content">
              <h4>Empty Custody</h4>
              <p style={{ margin: 0 }}>Nothing needs your care right now. You are not holding any company assets.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {myAssets.map(asset => {
              // Find matching approved handoff date to count elapsed hold time
              const activeHandoff = handoffs
                .filter(h => h.assetTag === asset.tag && h.status === "approved")
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
              
              const dateVal = activeHandoff ? activeHandoff.date : asset.dateRegistered;

              return (
                <div key={asset.tag} className="custody-line">
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <StampedTag tag={asset.tag} variant="stamp" />
                    <div>
                      <div style={{ fontWeight: "500" }}>{asset.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                        Location: {asset.location} · Serial: {asset.serial}
                      </div>
                    </div>
                  </div>
                  <div className="custody-meta">
                    <span className="custody-duration mono">
                      {formatLiveDuration(dateVal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Quiet KPIs (Section 7 PRD) */}
      <div>
        <h3 style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", letterSpacing: "0.055em", marginBottom: "16px" }}>
          System Metrics
        </h3>
        <div className="kpi-container">
          <div className="kpi-card">
            <div className="kpi-title">Total Registry</div>
            <div className="kpi-value">{totalAssetsCount}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Active Handoffs</div>
            <div className="kpi-value">{allocatedAssetsCount}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Under Care (Maint)</div>
            <div className="kpi-value">{maintenanceAssetsCount}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">My Custody Capital</div>
            <div className="mono kpi-value">${myAssetsValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

    </div>
  );
};
