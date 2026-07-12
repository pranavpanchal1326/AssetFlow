import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { ListTodo, CheckCheck, Eye, Bell, ShieldAlert, ArrowLeftRight } from "lucide-react";

export const Ledger = () => {
  const { ledger, markLedgerRead, currentUser } = useContext(AppContext);

  // States
  const [filterType, setFilterType] = useState("all"); // all, handoff, system
  const [filterRead, setFilterRead] = useState("all"); // all, unread, read

  // Mark notifications read on mount
  useEffect(() => {
    markLedgerRead();
  }, []);

  const filteredLedger = ledger.filter(item => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesRead = 
      filterRead === "all" || 
      (filterRead === "unread" && item.unread) || 
      (filterRead === "read" && !item.unread);

    return matchesType && matchesRead;
  });

  return (
    <div>
      
      {/* Ledger Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: "600" }}>System Ledger & Activity Logs</h3>
          <p style={{ fontSize: "12px", color: "var(--text-3)" }}>Historical ledger auditing all custody allocations and transfer workflows.</p>
        </div>
        <button className="btn btn-small" onClick={markLedgerRead}>
          <CheckCheck size={14} />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "6px 12px", fontSize: "13px", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}
        >
          <option value="all">All Types</option>
          <option value="handoff">Handoff Requests</option>
          <option value="system">System Actions</option>
        </select>

        <select 
          value={filterRead} 
          onChange={(e) => setFilterRead(e.target.value)}
          style={{ padding: "6px 12px", fontSize: "13px", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}
        >
          <option value="all">All Read Statuses</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="data-table-card" style={{ padding: "12px 0" }}>
        {filteredLedger.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)" }}>
            No logs matched active filters.
          </div>
        ) : (
          filteredLedger.map((item) => {
            const isHandoff = item.type === "handoff";
            const isSystem = item.type === "system";
            const isOverdue = item.message.toLowerCase().includes("overdue") || item.message.toLowerCase().includes("lost");

            return (
              <div 
                key={item.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: "16px", 
                  padding: "12px 24px", 
                  borderBottom: "1px solid var(--hairline-2)",
                  backgroundColor: item.unread ? "var(--accent-soft)" : "transparent"
                }}
              >
                
                {/* Icon wrapper */}
                <div 
                  style={{ 
                    padding: "8px", 
                    borderRadius: "4px", 
                    backgroundColor: isOverdue ? "var(--alert-soft)" : "var(--fill)",
                    color: isOverdue ? "var(--alert)" : isHandoff ? "var(--accent)" : "var(--text-2)",
                    marginTop: "2px"
                  }}
                >
                  {isOverdue ? <ShieldAlert size={14} /> : isHandoff ? <ArrowLeftRight size={14} /> : <ListTodo size={14} />}
                </div>

                {/* Log details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: item.unread ? "600" : "500", color: "var(--ink)" }}>
                      {item.message}
                    </span>
                    {item.unread && (
                      <span className="mono" style={{ fontSize: "9px", textTransform: "uppercase", color: "var(--accent)", fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
                        <Eye size={10} /> New
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "11px", color: "var(--text-3)" }}>
                    <span>Operator: <strong>{item.user}</strong></span>
                    <span>·</span>
                    <span className="mono">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
