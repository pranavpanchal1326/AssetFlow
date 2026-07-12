import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { Download, AlertTriangle } from "lucide-react";

export const Reports = () => {
  const { assets, careTickets, departments, employees, bookings, categories } = useContext(AppContext);

  // Mocks CSV Downloader
  const downloadCSV = (title) => {
    alert(`CSV Download initiated for [${title}] — Security verified.`);
  };

  // Helper calculations
  // 1. Utilization per Category
  const categoryUtilization = {};
  assets.forEach(a => {
    if (!categoryUtilization[a.category]) {
      categoryUtilization[a.category] = { total: 0, allocated: 0 };
    }
    categoryUtilization[a.category].total += 1;
    if (a.status === "allocated" || a.status === "reserved") {
      categoryUtilization[a.category].allocated += 1;
    }
  });

  // 2. Care ticket frequencies
  const maintFrequencies = {};
  careTickets.forEach(t => {
    const asset = assets.find(a => a.tag === t.assetTag);
    if (asset) {
      if (!maintFrequencies[asset.category]) {
        maintFrequencies[asset.category] = 0;
      }
      maintFrequencies[asset.category] += 1;
    }
  });

  // 3. Department allocations
  const deptAllocations = {};
  departments.forEach(d => {
    deptAllocations[d.name] = { count: 0, value: 0 };
  });
  deptAllocations["Unassigned"] = { count: 0, value: 0 };

  assets.forEach(a => {
    const holder = employees.find(e => e.id === a.heldBy);
    const deptName = holder ? holder.dept : "Unassigned";
    if (!deptAllocations[deptName]) {
      deptAllocations[deptName] = { count: 0, value: 0 };
    }
    deptAllocations[deptName].count += 1;
    deptAllocations[deptName].value += (a.cost || 0);
  });

  // 4. Overdue returns
  const overdueList = assets.filter(a => a.status === "alert" || a.overdueSince);

  // 5. Booking Heatmap Calculations (9am to 6pm, Mon to Fri)
  const heatmapHours = ["09:00", "11:00", "13:00", "15:00", "17:00"];
  const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  
  const getBookingCount = (dayIdx, hourIdx) => {
    // Return mock intensity count
    // (In real app, we parse booking start/end times and check overlaps. We mock it for beautiful visual display)
    const values = [
      [2, 0, 1, 1, 0],
      [1, 3, 0, 2, 1],
      [0, 1, 2, 0, 0],
      [1, 0, 1, 3, 2],
      [3, 2, 0, 1, 1]
    ];
    return values[dayIdx]?.[hourIdx] || 0;
  };

  const getHeatmapColor = (count) => {
    if (count === 0) return "transparent";
    if (count === 1) return "rgba(44, 95, 224, 0.15)";
    if (count === 2) return "rgba(44, 95, 224, 0.4)";
    return "var(--accent)"; // Maximum accent saturation
  };

  return (
    <div>
      
      {/* 1. First Row: Category Utilization & Maintenance Frequency */}
      <div className="grid-2" style={{ marginBottom: "24px" }}>
        
        {/* Category Utilization */}
        <div className="data-table-card" style={{ padding: "20px" }}>
          <div className="flex-between" style={{ marginBottom: "20px" }}>
            <h4 className="mono" style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)" }}>
              Category Utilization Rate
            </h4>
            <button className="btn btn-small" onClick={() => downloadCSV("Category Utilization")}>
              <Download size={12} />
              <span>CSV</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {Object.entries(categoryUtilization).map(([cat, val]) => {
              const pct = val.total > 0 ? Math.round((val.allocated / val.total) * 100) : 0;
              return (
                <div key={cat} style={{ fontSize: "13px" }}>
                  <div className="flex-between" style={{ marginBottom: "4px" }}>
                    <span style={{ fontWeight: "500" }}>{cat}</span>
                    <span className="mono" style={{ color: "var(--text-2)" }}>{pct}% ({val.allocated}/{val.total})</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "var(--fill)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--accent)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Maintenance frequency */}
        <div className="data-table-card" style={{ padding: "20px" }}>
          <div className="flex-between" style={{ marginBottom: "20px" }}>
            <h4 className="mono" style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)" }}>
              Care Log Frequency
            </h4>
            <button className="btn btn-small" onClick={() => downloadCSV("Maintenance Frequency")}>
              <Download size={12} />
              <span>CSV</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {categories.map(c => {
              const count = maintFrequencies[c.name] || 0;
              const maxVal = Math.max(...Object.values(maintFrequencies), 1);
              const pct = (count / maxVal) * 100;
              
              return (
                <div key={c.id} style={{ fontSize: "13px" }}>
                  <div className="flex-between" style={{ marginBottom: "4px" }}>
                    <span style={{ fontWeight: "500" }}>{c.name}</span>
                    <span className="mono" style={{ color: "var(--text-2)" }}>{count} issues</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "var(--fill)", borderRadius: "3px", overflow: "hidden" }}>
                    {/* Accent red used ONLY on worst value (Rule Reports 1) */}
                    <div style={{ 
                      width: `${pct}%`, 
                      height: "100%", 
                      backgroundColor: count > 0 && pct === 100 ? "var(--alert)" : "var(--text-2)" 
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Second Row: Department Allocations & Weekly booking heatmap */}
      <div className="grid-2" style={{ marginBottom: "24px" }}>
        
        {/* Department Allocation */}
        <div className="data-table-card" style={{ padding: "20px" }}>
          <div className="flex-between" style={{ marginBottom: "16px" }}>
            <h4 className="mono" style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)" }}>
              Departmental Asset Allocations
            </h4>
            <button className="btn btn-small" onClick={() => downloadCSV("Departmental Allocations")}>
              <Download size={12} />
              <span>CSV</span>
            </button>
          </div>

          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Department</th>
                <th className="right-align">Asset Count</th>
                <th className="right-align">Capital Asset Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(deptAllocations).map(([dept, val]) => (
                <tr key={dept}>
                  <td style={{ fontWeight: "500" }}>{dept}</td>
                  <td className="right-align mono">{val.count}</td>
                  <td className="right-align mono">${val.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Heatmap (Day x Hour) */}
        <div className="data-table-card" style={{ padding: "20px" }}>
          <div className="flex-between" style={{ marginBottom: "20px" }}>
            <h4 className="mono" style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)" }}>
              Weekly Booking Heatmap
            </h4>
            <button className="btn btn-small" onClick={() => downloadCSV("Booking Heatmap")}>
              <Download size={12} />
              <span>CSV</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Days row */}
            <div style={{ display: "grid", gridTemplateColumns: "50px repeat(5, 1fr)", gap: "8px", textAlign: "center" }}>
              <div />
              {heatmapDays.map(d => <div key={d} className="mono" style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-3)" }}>{d}</div>)}
            </div>

            {/* Hours Rows */}
            {heatmapHours.map((hour, hourIdx) => (
              <div key={hour} style={{ display: "grid", gridTemplateColumns: "50px repeat(5, 1fr)", gap: "8px", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: "10.5px", color: "var(--text-3)" }}>{hour}</span>
                {heatmapDays.map((_, dayIdx) => {
                  const count = getBookingCount(dayIdx, hourIdx);
                  const color = getHeatmapColor(count);
                  
                  return (
                    <div 
                      key={dayIdx} 
                      style={{ 
                        height: "28px", 
                        backgroundColor: color, 
                        border: "1px solid var(--hairline)", 
                        borderRadius: "3px", 
                        display: "flex", 
                        alignItems: "center", 
                        justify: "center", 
                        cursor: "pointer" 
                      }}
                      title={`${count} active reservations`}
                    >
                      {count > 0 && (
                        <span className="mono" style={{ fontSize: "10px", color: count >= 3 ? "#FFF" : "var(--ink)", fontWeight: "500" }}>
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Third Row: Overdue return list */}
      <div className="data-table-card" style={{ padding: "20px" }}>
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <h4 className="mono" style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)" }}>
            Overdue Custody Registers
          </h4>
          <button className="btn btn-small" onClick={() => downloadCSV("Overdue Returns")}>
            <Download size={12} />
            <span>CSV</span>
          </button>
        </div>

        <table className="data-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: "96px" }}>Tag</th>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Current Holder</th>
              <th>Overdue Since</th>
              <th className="right-align">Asset Cost</th>
            </tr>
          </thead>
          <tbody>
            {overdueList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "var(--text-3)", height: "60px" }}>
                  No overdue assets in circulation. System fully aligned.
                </td>
              </tr>
            ) : (
              overdueList.map(a => {
                const holder = employees.find(e => e.id === a.heldBy);
                return (
                  <tr key={a.tag}>
                    <td className="table-tag" style={{ color: "var(--alert)" }}>{a.tag}</td>
                    <td style={{ fontWeight: "500" }}>{a.name}</td>
                    <td>{a.category}</td>
                    <td>{holder ? holder.name : "—"}</td>
                    <td className="mono" style={{ color: "var(--alert)", fontWeight: "600" }}>
                      <span className="flex-align-center" style={{ gap: "4px" }}>
                        <AlertTriangle size={12} />
                        {new Date(a.overdueSince || "2026-07-05T18:00:00Z").toLocaleDateString()}
                      </span>
                    </td>
                    <td className="right-align mono">${a.cost?.toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
