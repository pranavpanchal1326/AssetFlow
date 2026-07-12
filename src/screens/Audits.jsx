import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { ConsequenceGate } from "../components/ConsequenceGate";
import { AlertCircle, CheckCircle, HelpCircle, ShieldAlert, ShieldCheck } from "lucide-react";

export const Audits = () => {
  const { 
    audits, 
    assets, 
    employees, 
    departments, 
    createAuditCycle, 
    updateAuditCheckItem, 
    closeAuditCycle 
  } = useContext(AppContext);

  // States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState(() => {
    return audits.length > 0 ? audits[0].id : "";
  });

  // Create Audit form state
  const [auditTitle, setAuditTitle] = useState("");
  const [scopeDeptId, setScopeDeptId] = useState("");
  const [endDate, setEndDate] = useState("2026-07-20");

  // Consequence Gate modal states
  const [gateOpen, setGateOpen] = useState(false);
  const [gateAuditId, setGateAuditId] = useState("");

  const activeAudit = audits.find(a => a.id === selectedAuditId);

  // Handle create submit
  const handleCreateAudit = (e) => {
    e.preventDefault();
    if (!auditTitle || !scopeDeptId) return;

    createAuditCycle({
      title: auditTitle,
      scopeDeptDeptId: scopeDeptId,
      endDate
    });

    setAuditTitle("");
    setScopeDeptId("");
    setShowCreateForm(false);
    
    // Auto-select newly created audit
    setTimeout(() => {
      if (audits.length > 0) {
        setSelectedAuditId(audits[audits.length - 1].id);
      }
    }, 100);

    alert("Audit cycle initiated successfully.");
  };

  // Trigger Consequence Gate
  const handleTriggerClose = (auditId) => {
    setGateAuditId(auditId);
    setGateOpen(true);
  };

  // Commit close audit
  const handleAuthorizeClose = (businessReason) => {
    setGateOpen(false);
    closeAuditCycle(gateAuditId);
    alert(`Audit cycle successfully closed.\nBusiness authorization logged:\n"${businessReason}"`);
  };

  // Compile list of affected items & people for Consequence Gate
  const getGateDetails = () => {
    if (!activeAudit) return { items: [], people: [] };
    
    const missingTags = activeAudit.checklist
      .filter(item => item.status === "missing")
      .map(item => item.assetTag);
    
    const damagedTags = activeAudit.checklist
      .filter(item => item.status === "damaged")
      .map(item => item.assetTag);

    const targetTags = [...missingTags, ...damagedTags];
    const impactedAssets = assets.filter(a => targetTags.includes(a.tag));
    
    const holderIds = impactedAssets.map(a => a.heldBy).filter(Boolean);
    const impactedPeople = employees.filter(e => holderIds.includes(e.id));

    return {
      items: impactedAssets,
      people: impactedPeople
    };
  };

  const gateDetails = getGateDetails();

  return (
    <div>
      
      {/* Consequence Gate Modal */}
      <ConsequenceGate 
        isOpen={gateOpen}
        title="Authorize Audit Cycle Closure"
        warningMessage="WARNING: Closing this audit cycle will permanently update global asset registries. Missing items will be deregistered and marked as LOST. Damaged items will be locked for maintenance and Care work tickets generated."
        affectedItems={gateDetails.items}
        affectedPeople={gateDetails.people}
        confirmText="AUTHORIZE CLOSE"
        onConfirm={handleAuthorizeClose}
        onClose={() => setGateOpen(false)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div className="flex-align-center">
          <span className="mono" style={{ fontSize: "12px", color: "var(--text-3)" }}>ACTIVE AUDIT /</span>
          <select 
            value={selectedAuditId} 
            onChange={(e) => setSelectedAssetId(e.target.value) || setSelectedAuditId(e.target.value)}
            style={{ 
              padding: "8px 16px", 
              fontSize: "14px", 
              fontWeight: "600",
              backgroundColor: "var(--surface)", 
              border: "1px solid var(--hairline)", 
              borderRadius: "4px" 
            }}
          >
            <option value="">Select Audit Cycle...</option>
            {audits.map(a => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
          <span>New Audit Cycle</span>
        </button>
      </div>

      {activeAudit ? (
        <div className="grid-2" style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}>
          
          {/* Left: Audit Checklist Table */}
          <div className="data-table-card">
            <div style={{ padding: "16px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-3)", textTransform: "uppercase" }}>
                Checklist — {activeAudit.scopeDept} Department
              </span>
              <span className="mono" style={{ fontSize: "11px", color: "var(--text-3)" }}>
                End Date: {activeAudit.endDate}
              </span>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "96px" }}>Asset Tag</th>
                  <th>Description</th>
                  <th style={{ width: "150px" }}>Custodian</th>
                  <th style={{ width: "200px", textAlign: "center" }}>Audit Status Check</th>
                  <th>Auditor Notes</th>
                </tr>
              </thead>
              <tbody>
                {activeAudit.checklist.map(item => {
                  const asset = assets.find(a => a.tag === item.assetTag);
                  const holder = employees.find(e => e.id === asset?.heldBy);
                  const isReadOnly = activeAudit.status === "completed";

                  return (
                    <tr key={item.assetTag}>
                      <td><StampedTag tag={item.assetTag} /></td>
                      <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <strong>{asset?.name}</strong> <span className="mono" style={{ fontSize: "11px", color: "var(--text-3)", marginLeft: "4px" }}>({asset?.serial})</span>
                      </td>
                      <td>{holder ? holder.name : "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        {isReadOnly ? (
                          <span className="mono" style={{ 
                            fontSize: "11.5px", 
                            fontWeight: "600",
                            color: item.status === "verified" ? "var(--available)" : item.status === "missing" ? "var(--alert)" : "var(--maint)"
                          }}>
                            {item.status.toUpperCase()}
                          </span>
                        ) : (
                          <div style={{ display: "inline-flex", gap: "2px", border: "1px solid var(--hairline)", borderRadius: "4px", overflow: "hidden" }}>
                            <button 
                              type="button"
                              className={`btn btn-small`}
                              onClick={() => updateAuditCheckItem(activeAudit.id, item.assetTag, "verified", item.notes)}
                              style={{ 
                                height: "24px", padding: "2px 8px", fontSize: "11px", border: "none", borderRadius: 0,
                                backgroundColor: item.status === "verified" ? "var(--available)" : "transparent",
                                color: item.status === "verified" ? "#fff" : "var(--text-2)"
                              }}
                            >
                              Verify
                            </button>
                            <button 
                              type="button"
                              className={`btn btn-small`}
                              onClick={() => updateAuditCheckItem(activeAudit.id, item.assetTag, "damaged", item.notes)}
                              style={{ 
                                height: "24px", padding: "2px 8px", fontSize: "11px", border: "none", borderRadius: 0,
                                backgroundColor: item.status === "damaged" ? "var(--maint)" : "transparent",
                                color: item.status === "damaged" ? "#fff" : "var(--text-2)"
                              }}
                            >
                              Damage
                            </button>
                            <button 
                              type="button"
                              className={`btn btn-small`}
                              onClick={() => updateAuditCheckItem(activeAudit.id, item.assetTag, "missing", item.notes)}
                              style={{ 
                                height: "24px", padding: "2px 8px", fontSize: "11px", border: "none", borderRadius: 0,
                                backgroundColor: item.status === "missing" ? "var(--alert)" : "transparent",
                                color: item.status === "missing" ? "#fff" : "var(--text-2)"
                              }}
                            >
                              Missing
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {isReadOnly ? (
                          <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{item.notes || "—"}</span>
                        ) : (
                          <input 
                            type="text" 
                            className="form-control"
                            value={item.notes}
                            onChange={(e) => updateAuditCheckItem(activeAudit.id, item.assetTag, item.status, e.target.value)}
                            placeholder="Add notes..."
                            style={{ padding: "4px 8px", height: "24px", fontSize: "12px" }}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right: Discrepancy report summary card */}
          <div>
            <div className="data-table-card" style={{ padding: "20px", marginBottom: "20px" }}>
              <h4 className="mono" style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "16px" }}>
                Audit Discrepancy Summary
              </h4>

              {/* Calculations */}
              {(() => {
                const total = activeAudit.checklist.length;
                const verified = activeAudit.checklist.filter(i => i.status === "verified").length;
                const damaged = activeAudit.checklist.filter(i => i.status === "damaged").length;
                const missing = activeAudit.checklist.filter(i => i.status === "missing").length;
                const pending = activeAudit.checklist.filter(i => i.status === "pending").length;

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "var(--text-2)" }}>Checked Progress:</span>
                      <span className="mono" style={{ fontWeight: "600" }}>{verified + damaged + missing} / {total}</span>
                    </div>

                    <div style={{ height: "6px", backgroundColor: "var(--fill)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${(verified/total)*100}%`, backgroundColor: "var(--available)" }} />
                      <div style={{ width: `${(damaged/total)*100}%`, backgroundColor: "var(--maint)" }} />
                      <div style={{ width: `${(missing/total)*100}%`, backgroundColor: "var(--alert)" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", borderTop: "1px solid var(--hairline-2)", paddingTop: "12px" }}>
                      <div className="flex-between">
                        <span className="flex-align-center" style={{ color: "var(--available)" }}>
                          <CheckCircle size={12} /> Verified
                        </span>
                        <span className="mono">{verified}</span>
                      </div>
                      <div className="flex-between">
                        <span className="flex-align-center" style={{ color: "var(--maint)" }}>
                          <AlertCircle size={12} /> Damaged (Repair)
                        </span>
                        <span className="mono">{damaged}</span>
                      </div>
                      <div className="flex-between">
                        <span className="flex-align-center" style={{ color: "var(--alert)" }}>
                          <ShieldAlert size={12} /> Missing (Lost)
                        </span>
                        <span className="mono">{missing}</span>
                      </div>
                      <div className="flex-between" style={{ color: "var(--text-3)" }}>
                        <span className="flex-align-center">
                          <HelpCircle size={12} /> Pending Check
                        </span>
                        <span className="mono">{pending}</span>
                      </div>
                    </div>

                    {activeAudit.status === "active" && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleTriggerClose(activeAudit.id)}
                        disabled={pending > 0}
                        style={{ width: "100%", marginTop: "8px" }}
                        title={pending > 0 ? "Complete all checklists to close audit" : "Authorize and commit values"}
                      >
                        <ShieldCheck size={16} />
                        <span>Close Cycle & Authorize</span>
                      </button>
                    )}

                    {activeAudit.status === "completed" && (
                      <div style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)", padding: "8px 12px", borderRadius: "4px", fontSize: "11px", textAlign: "center" }}>
                        <strong>Audit Closed.</strong> Global values updated successfully.
                      </div>
                    )}

                  </div>
                );
              })()}

            </div>
          </div>

        </div>
      ) : (
        <div className="refusal-alert" style={{ backgroundColor: "var(--surface)", textAlign: "center", padding: "48px 24px" }}>
          <div className="refusal-alert-content">
            <h4>No active audits</h4>
            <p style={{ marginBottom: "16px" }}>Initialize a periodic reconciliation cycle using the button above.</p>
            <button className="btn" onClick={() => setShowCreateForm(true)}>Initiate First Cycle</button>
          </div>
        </div>
      )}

      {/* Create Audit Modal Popup */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Initiate Audit Cycle</h3>
              <button onClick={() => setShowCreateForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateAudit}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label>Audit Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={auditTitle} 
                    onChange={(e) => setAuditTitle(e.target.value)} 
                    placeholder="e.g. Q3 Design Division Audit" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Scope (Department)</label>
                  <select 
                    className="form-control"
                    value={scopeDeptId}
                    onChange={(e) => setScopeDeptId(e.target.value)}
                    required
                  >
                    <option value="">Choose Scope...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Deadline (End Date)</label>
                  <input 
                    type="date" 
                    className="form-control mono"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required 
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Start Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
