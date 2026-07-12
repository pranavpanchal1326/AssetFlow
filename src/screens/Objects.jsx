import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { LifecycleRail } from "../components/LifecycleRail";
import { Search, Filter, QrCode, X, Plus, Calendar, Wrench, Download } from "lucide-react";

export const Objects = ({ globalSearchQuery = "" }) => {
  const { 
    assets, 
    categories, 
    employees, 
    handoffs, 
    careTickets, 
    updateAssetDetails,
    registerAsset,
    currentUser 
  } = useContext(AppContext);

  // States
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Sync global search from sidebar
  useEffect(() => {
    if (globalSearchQuery) {
      setSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Asset Registration Form state
  const [regName, setRegName] = useState("");
  const [regCategory, setRegCategory] = useState("");
  const [regSerial, setRegSerial] = useState("");
  const [regCost, setRegCost] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regCondition, setRegCondition] = useState("excellent");
  const [regHeldBy, setRegHeldBy] = useState("");
  const [regBookable, setRegBookable] = useState(false);
  const [regCustomFields, setRegCustomFields] = useState({});

  const activeCategory = categories.find(c => c.name === regCategory);

  // Reset reg form
  const resetRegForm = () => {
    setRegName("");
    setRegCategory("");
    setRegSerial("");
    setRegCost("");
    setRegLocation("");
    setRegCondition("excellent");
    setRegHeldBy("");
    setRegBookable(false);
    setRegCustomFields({});
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regName || !regCategory) return;

    registerAsset({
      name: regName,
      category: regCategory,
      serial: regSerial || `SR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      cost: parseFloat(regCost) || 0,
      location: regLocation || "Main Office",
      condition: regCondition,
      heldBy: regHeldBy || null,
      bookable: regBookable,
      customFields: regCustomFields
    });

    setShowRegisterForm(false);
    resetRegForm();
  };

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = filterCategory === "all" || asset.category === filterCategory;
    const matchesStatus = filterStatus === "all" || asset.status === filterStatus;

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Fetch asset details
  const assetHandoffHistory = selectedAsset 
    ? handoffs
        .filter(h => h.assetTag === selectedAsset.tag)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  const assetCareHistory = selectedAsset
    ? careTickets
        .filter(c => c.assetTag === selectedAsset.tag)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  // Update status from Lifecycle Rail
  const handleRailStatusChange = (newStatus) => {
    if (!selectedAsset) return;
    
    // Determine assignee clear if available
    let updateData = { status: newStatus };
    if (newStatus === "available" || newStatus === "disposed") {
      updateData.heldBy = null;
    }

    updateAssetDetails(selectedAsset.tag, updateData);
    setSelectedAsset(prev => ({ ...prev, ...updateData }));
  };

  return (
    <div style={{ position: "relative" }}>
      
      {/* Search and Filters Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        
        {/* Search */}
        <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "280px" }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: "10px", color: "var(--text-3)" }} />
            <input 
              type="text" 
              placeholder="Search tag, serial, or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "30px" }}
            />
          </div>
          <button className={`btn ${showQRScanner ? "btn-primary" : ""}`} onClick={() => setShowQRScanner(!showQRScanner)}>
            <QrCode size={14} />
            <span>QR Scan</span>
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: "8px", fontSize: "13px", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "8px", fontSize: "13px", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="allocated">Allocated</option>
            <option value="reserved">Reserved</option>
            <option value="maint">Maintenance</option>
            <option value="alert">Alert (Overdue)</option>
            <option value="disposed">Disposed</option>
          </select>

          {["Admin", "Manager"].includes(currentUser?.role) && (
            <button className="btn btn-primary" onClick={() => setShowRegisterForm(true)}>
              <Plus size={14} />
              <span>Register</span>
            </button>
          )}
        </div>
      </div>

      {/* QR Scanner Mock Screen */}
      {showQRScanner && (
        <div className="refusal-alert" style={{ backgroundColor: "var(--fill)", borderStyle: "dashed", marginBottom: "24px", justifyContent: "center", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" }}>
          <div style={{ width: "160px", height: "160px", border: "2px solid var(--accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", backgroundColor: "#000", marginBottom: "16px" }}>
            <div style={{ color: "#FFF", fontSize: "12px" }}>Mock Camera View</div>
            <div style={{ position: "absolute", width: "100%", height: "2px", backgroundColor: "var(--accent)", top: "50%", animation: "pulse-red 1.5s infinite" }}></div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "12px" }}>Point camera at a stamped QR plate on the asset.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-small" onClick={() => { setSelectedAsset(assets[0]); setShowQRScanner(false); }} style={{ fontSize: "11px" }}>
              Scan AF-0001
            </button>
            <button className="btn btn-small" onClick={() => { setSelectedAsset(assets[7]); setShowQRScanner(false); }} style={{ fontSize: "11px" }}>
              Scan AF-0008 (Overdue)
            </button>
            <button className="btn btn-small" onClick={() => setShowQRScanner(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Main Grid split: Table List on left, Detail panel on right */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        
        {/* Table List (adheres to Section 4 table execution rules) */}
        <div className="data-table-card" style={{ flex: 1, minWidth: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "96px" }}>Tag</th>
                <th>Object & Serial</th>
                <th style={{ width: "128px" }}>Category</th>
                <th style={{ width: "200px" }}>In Whose Hands</th>
                <th style={{ width: "150px" }}>Status</th>
                <th style={{ width: "150px" }}>Location</th>
                <th className="right-align" style={{ width: "110px" }}>Held Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "var(--text-3)", height: "80px" }}>
                    Nothing's being tracked yet. Register the first thing.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const holder = employees.find(e => e.id === asset.heldBy);
                  
                  // Find approved handoff date
                  const matchHandoff = handoffs
                    .filter(h => h.assetTag === asset.tag && h.status === "approved")
                    .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                  
                  const heldDate = matchHandoff 
                    ? new Date(matchHandoff.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
                    : "—";

                  return (
                    <tr 
                      key={asset.tag} 
                      onClick={() => setSelectedAsset(asset)}
                      style={{ cursor: "pointer", background: selectedAsset?.tag === asset.tag ? "var(--fill)" : "none" }}
                    >
                      {/* Rule 1: No boxed tag plates in tables - plain mono nowrap tag */}
                      <td className="table-tag">{asset.tag}</td>
                      
                      {/* Rule 2: One line per row - names truncate. Rule 3: Serial inline and doesn't add height */}
                      <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <span style={{ fontWeight: "500", color: "var(--ink)" }}>{asset.name}</span>
                        <span className="mono" style={{ fontSize: "11.5px", color: "var(--text-3)", marginLeft: "8px" }}>
                          {asset.serial}
                        </span>
                      </td>

                      <td>{asset.category}</td>

                      {/* Rule 5: One consistent "unheld" style: avatar+name or mono bar+word */}
                      <td>
                        {holder ? (
                          <div className="table-person">
                            <span className="table-avatar">{holder.avatar}</span>
                            <span>{holder.name}</span>
                          </div>
                        ) : (
                          <span className="unheld-cell mono">— available</span>
                        )}
                      </td>

                      {/* Status = dot + label, never candy pill */}
                      <td>
                        <div className="status-dot-wrapper">
                          <span className={`status-dot ${asset.status}`} />
                          <span style={{ fontSize: "12px", textTransform: "capitalize" }}>
                            {asset.status === "maint" ? "Maintenance" : asset.status}
                          </span>
                        </div>
                      </td>

                      <td style={{ color: "var(--text-3)" }}>{asset.location}</td>

                      {/* Rule 6: Density - right-aligned tabular date */}
                      <td className="right-align mono">{heldDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Asset Details sheet */}
        {selectedAsset && (
          <div 
            className="data-table-card detail-drawer-enter" 
            style={{ 
              width: "420px", 
              padding: "24px", 
              backgroundColor: "var(--surface)", 
              border: "1px solid var(--hairline)", 
              flexShrink: 0,
              position: "sticky",
              top: "80px"
            }}
          >
            {/* Header */}
            <div className="flex-between" style={{ marginBottom: "20px" }}>
              <div className="flex-align-center">
                <StampedTag tag={selectedAsset.tag} variant="hero" />
                <span className={`condition-stamp ${selectedAsset.condition}`}>
                  {selectedAsset.condition}
                </span>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--ink)", marginBottom: "4px" }}>
                {selectedAsset.name}
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                Serial: <code className="mono">{selectedAsset.serial}</code> · Registered: <span className="mono">{selectedAsset.dateRegistered}</span>
              </p>
            </div>

            {/* Lifecycle Rail (Section 6.5) */}
            <div style={{ borderTop: "1px solid var(--hairline-2)", paddingTop: "16px" }}>
              <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block" }}>
                Lifecycle Rail
              </span>
              <LifecycleRail 
                currentStatus={selectedAsset.status} 
                onChangeStatus={handleRailStatusChange}
                readOnly={!["Admin", "Manager"].includes(currentUser?.role)}
              />
            </div>

            {/* Category Specifications (JSON Custom Fields) */}
            {selectedAsset.customFields && Object.keys(selectedAsset.customFields).length > 0 && (
              <div style={{ borderTop: "1px solid var(--hairline-2)", paddingTop: "16px", marginBottom: "20px" }}>
                <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>
                  Specifications
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px 16px", fontSize: "12px" }}>
                  {Object.entries(selectedAsset.customFields).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <span style={{ color: "var(--text-3)" }}>{k}:</span>
                      <span style={{ fontWeight: "500" }}>{String(v)}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Print QR Plate (Section 8) */}
            <div style={{ borderTop: "1px solid var(--hairline-2)", paddingTop: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                {/* Mock QR SVG */}
                <div style={{ padding: "8px", border: "1px solid var(--hairline)", borderRadius: "4px", backgroundColor: "#fff", display: "inline-block" }}>
                  <svg width="60" height="60" viewBox="0 0 29 29" style={{ display: "block" }}>
                    <path d="M0 0h9v9H0zm1 1v7h7V1zm2 2h3v3H3zM0 20h9v9H0zm1 1v7h7v-7zm2 2h3v3H3zM20 0h9v9h-9zm1 1v7h7V1zm2 2h3v3h-3z" fill="#18181b"/>
                    <path d="M12 2h1v1h-1zm1 2h1v2h-1zm2-3h1v1h-1zm2 2h1v1h-1zm-4 4h2v1h-2zm3-2h1v1h-1zm1 2h1v1h-1zm2 1h1v1h-1zm-6 2h1v2h-1zm2 1h1v1h-1zm2-1h1v1h-1zm2 1h1v1h-1zm-3 2h2v1h-2zm3-1h1v2h-1zm-7 3h1v2h-1zm2 1h2v1h-2zm1-2h1v1h-1zm4 1h1v2h-1z" fill="#18181b"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", display: "block" }}>Stamped QR Plate</span>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "2px 0 8px 0" }}>Print and scan to instantly view or hand over this object.</p>
                  <button className="btn btn-small" style={{ fontSize: "11px" }} onClick={() => window.print()}>
                    <Download size={12} />
                    <span>Print Label</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Custody History Ledger (Vertical ledger) */}
            <div style={{ borderTop: "1px solid var(--hairline-2)", paddingTop: "16px", marginBottom: "20px" }}>
              <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: "12px" }}>
                Custody Ledger
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                {assetHandoffHistory.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-3)" }}>No custody records on file.</div>
                ) : (
                  assetHandoffHistory.map((item, idx) => {
                    const toUser = employees.find(e => e.id === item.toEmployeeId);
                    return (
                      <div key={item.id} style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
                          {idx !== assetHandoffHistory.length - 1 && (
                            <span style={{ flex: 1, width: "1px", backgroundColor: "var(--hairline)", margin: "4px 0" }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div>
                            <span style={{ fontWeight: "500" }}>{toUser?.name || "Inventory"}</span>
                            <span style={{ color: "var(--text-3)", textTransform: "capitalize", marginLeft: "6px" }}>
                              ({item.type})
                            </span>
                          </div>
                          <div className="mono" style={{ fontSize: "10.5px", color: "var(--text-3)", marginTop: "2px" }}>
                            {new Date(item.date).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Maintenance History */}
            <div style={{ borderTop: "1px solid var(--hairline-2)", paddingTop: "16px" }}>
              <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: "12px" }}>
                Care Log
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {assetCareHistory.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-3)" }}>No ticket logs recorded.</div>
                ) : (
                  assetCareHistory.map(ticket => (
                    <div key={ticket.id} style={{ fontSize: "12px", display: "flex", gap: "8px" }}>
                      <Wrench size={12} style={{ color: "var(--text-3)", marginTop: "3px" }} />
                      <div>
                        <div style={{ fontWeight: "500" }}>{ticket.issue}</div>
                        <div style={{ color: "var(--text-3)", fontSize: "10.5px", marginTop: "2px" }}>
                          Status: <span className="mono">{ticket.status.toUpperCase()}</span> · <span className="mono">{new Date(ticket.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Asset Registration Modal Popup (Section 8) */}
      {showRegisterForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Asset</h3>
              <button onClick={() => setShowRegisterForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>
                ×
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit}>
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label>Asset Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={regName} 
                      onChange={(e) => setRegName(e.target.value)} 
                      placeholder="MacBook Pro M3 Max" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      className="form-control" 
                      value={regCategory} 
                      onChange={(e) => { setRegCategory(e.target.value); setRegCustomFields({}); }}
                      required
                    >
                      <option value="">Choose Category</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Serial Number</label>
                    <input 
                      type="text" 
                      className="form-control mono" 
                      value={regSerial} 
                      onChange={(e) => setRegSerial(e.target.value)} 
                      placeholder="e.g. SN-839284" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Acquisition Cost ($)</label>
                    <input 
                      type="number" 
                      className="form-control mono" 
                      value={regCost} 
                      onChange={(e) => setRegCost(e.target.value)} 
                      placeholder="e.g. 1999" 
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Location</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={regLocation} 
                      onChange={(e) => setRegLocation(e.target.value)} 
                      placeholder="HQ - Floor 3" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Condition</label>
                    <select 
                      className="form-control" 
                      value={regCondition} 
                      onChange={(e) => setRegCondition(e.target.value)}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Allocate Immediately</label>
                    <select 
                      className="form-control" 
                      value={regHeldBy} 
                      onChange={(e) => setRegHeldBy(e.target.value)}
                    >
                      <option value="">Leave Unheld (Available)</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ display: "flex", alignItems: "center", height: "100%", marginTop: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: "normal", fontSize: "13px" }}>
                      <input 
                        type="checkbox" 
                        checked={regBookable} 
                        onChange={(e) => setRegBookable(e.target.checked)} 
                      />
                      Shared/Bookable Resource
                    </label>
                  </div>
                </div>

                {/* Render Dynamic custom specifications if category has them */}
                {activeCategory && activeCategory.customFields && activeCategory.customFields.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: "16px", marginTop: "8px" }}>
                    <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: "12px" }}>
                      Custom Specifications ({regCategory})
                    </span>
                    <div className="grid-2">
                      {activeCategory.customFields.map(field => (
                        <div className="form-group" key={field.key}>
                          <label>{field.label}</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={regCustomFields[field.key] || ""}
                            onChange={(e) => setRegCustomFields({
                              ...regCustomFields,
                              [field.key]: e.target.value
                            })}
                            placeholder={`Enter ${field.label}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowRegisterForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
