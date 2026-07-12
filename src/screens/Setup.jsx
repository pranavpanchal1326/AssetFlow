import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Plus, UserPlus, GitFork, Tag, Users, AlertTriangle } from "lucide-react";

export const Setup = () => {
  const { 
    departments, 
    categories, 
    employees, 
    addDepartment, 
    addCategory, 
    promoteEmployeeRole,
    currentUser 
  } = useContext(AppContext);

  // Tab State: depts, categories, directory
  const [activeSubTab, setActiveSubTab] = useState("depts");

  // Department Form state
  const [deptName, setDeptName] = useState("");
  const [deptHeadId, setDeptHeadId] = useState("");
  const [deptParentId, setDeptParentId] = useState("");

  // Category Form State
  const [catName, setCatName] = useState("");
  const [fields, setFields] = useState([{ key: "", label: "", type: "text" }]);

  // Directory promoter validation modal
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState(null);

  if (currentUser?.role !== "Admin") {
    return (
      <div className="consequence-warning-box">
        <h4>Access Refused</h4>
        <p>Administrative configurations are locked. Setup access is strictly restricted to Administrators.</p>
      </div>
    );
  }

  // Handle department submit
  const handleAddDept = (e) => {
    e.preventDefault();
    if (!deptName) return;

    addDepartment(deptName, deptHeadId || null, deptParentId || null);
    setDeptName("");
    setDeptHeadId("");
    setDeptParentId("");
    alert("Department registered successfully.");
  };

  // Add field row to category builder
  const handleAddFieldRow = () => {
    setFields([...fields, { key: "", label: "", type: "text" }]);
  };

  const handleFieldChange = (index, prop, val) => {
    const updated = [...fields];
    updated[index][prop] = val;
    // Auto-generate key from label if editing label
    if (prop === "label") {
      updated[index].key = val.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    }
    setFields(updated);
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!catName) return;

    // Filter out blank custom fields
    const validFields = fields.filter(f => f.key.trim() && f.label.trim());
    addCategory(catName, validFields);

    setCatName("");
    setFields([{ key: "", label: "", type: "text" }]);
    alert("Asset Category and dynamic specification schema created.");
  };

  // Trigger directory promoter
  const triggerRoleChange = (emp, newRole) => {
    setPromoteTarget({ emp, newRole });
    setShowRoleConfirm(true);
  };

  // Commit promoter
  const handleConfirmRoleChange = () => {
    if (!promoteTarget) return;
    const { emp, newRole } = promoteTarget;
    promoteEmployeeRole(emp.id, newRole, emp.dept);
    setShowRoleConfirm(false);
    setPromoteTarget(null);
    alert(`Authorized: ${emp.name} credentials updated to ${newRole}.`);
  };

  return (
    <div>
      
      {/* Promoter Confirmation Modal */}
      {showRoleConfirm && promoteTarget && (
        <div className="modal-overlay">
          <div className="modal-content consequence-gate">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: "var(--alert)" }}>
                Confirm Credential Authority Shift
              </h3>
              <button onClick={() => setShowRoleConfirm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="consequence-warning-box">
                <AlertTriangle size={16} style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }} />
                <strong>CAUTION: Changing account privilege levels.</strong>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: "1.6" }}>
                You are authorizing a change in operational authority for <strong>{promoteTarget.emp.name}</strong>. 
                Promoting or demoting privilege levels impacts access scopes across audits, care channels, and setup dashboards.
              </p>
              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--fill)", borderRadius: "4px" }}>
                <span className="mono" style={{ fontSize: "11px", color: "var(--text-3)" }}>privilege transformation:</span>
                <div style={{ fontWeight: "600", fontSize: "13px", marginTop: "4px" }}>
                  {promoteTarget.emp.role} → {promoteTarget.newRole}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => { setShowRoleConfirm(false); setPromoteTarget(null); }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmRoleChange}>
                Authorize Role Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--hairline)", marginBottom: "24px", paddingBottom: "8px" }}>
        <button 
          className={`btn ${activeSubTab === "depts" ? "btn-primary" : ""}`}
          onClick={() => setActiveSubTab("depts")}
        >
          <GitFork size={14} />
          <span>Departments Tree</span>
        </button>
        <button 
          className={`btn ${activeSubTab === "categories" ? "btn-primary" : ""}`}
          onClick={() => setActiveSubTab("categories")}
        >
          <Tag size={14} />
          <span>Categories & Custom Fields</span>
        </button>
        <button 
          className={`btn ${activeSubTab === "directory" ? "btn-primary" : ""}`}
          onClick={() => setActiveSubTab("directory")}
        >
          <Users size={14} />
          <span>Employee Directory</span>
        </button>
      </div>

      {/* TAB A: DEPARTMENTS */}
      {activeSubTab === "depts" && (
        <div className="grid-2" style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}>
          
          {/* Department tree display */}
          <div className="data-table-card" style={{ padding: "24px" }}>
            <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: "16px" }}>
              Corporate Organization Tree
            </span>
            
            {/* Hierarchical Tree Rendering */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {departments.filter(d => !d.parentId).map(rootDept => {
                const subDepts = departments.filter(d => d.parentId === rootDept.name || d.parentId === rootDept.id);
                const manager = employees.find(e => e.id === rootDept.headEmployeeId);
                
                return (
                  <div key={rootDept.id} style={{ borderLeft: "2px solid var(--hairline)", paddingLeft: "16px", marginLeft: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{rootDept.name}</strong>
                        <span className="mono" style={{ fontSize: "11px", color: "var(--text-3)", marginLeft: "8px" }}>
                          (Head: {manager ? manager.name : "Unassigned"})
                        </span>
                      </div>
                      <span className="status-dot-wrapper" style={{ fontSize: "11px" }}>
                        <span className="status-dot available" /> active
                      </span>
                    </div>

                    {/* Children nested */}
                    {subDepts.length > 0 && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "20px" }}>
                        {subDepts.map(sub => {
                          const subManager = employees.find(e => e.id === sub.headEmployeeId);
                          return (
                            <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "1px dashed var(--hairline)", paddingLeft: "12px" }}>
                              <div>
                                <span>{sub.name}</span>
                                <span className="mono" style={{ fontSize: "10.5px", color: "var(--text-3)", marginLeft: "6px" }}>
                                  (Head: {subManager ? subManager.name : "Unassigned"})
                                </span>
                              </div>
                              <span style={{ fontSize: "11px", color: "var(--text-3)" }}>division</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* Add Dept Form Card */}
          <div className="data-table-card" style={{ padding: "20px" }}>
            <h4 className="mono" style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "16px" }}>
              Add Department Division
            </h4>
            <form onSubmit={handleAddDept}>
              <div className="form-group">
                <label>Department Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Product Design"
                  required
                />
              </div>

              <div className="form-group">
                <label>Division Head</label>
                <select 
                  className="form-control"
                  value={deptHeadId}
                  onChange={(e) => setDeptHeadId(e.target.value)}
                >
                  <option value="">Choose Employee Head...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Parent Department</label>
                <select 
                  className="form-control"
                  value={deptParentId}
                  onChange={(e) => setDeptParentId(e.target.value)}
                >
                  <option value="">No Parent (Root Department)</option>
                  {departments.filter(d => !d.parentId).map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                <Plus size={14} />
                <span>Create Department</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB B: CATEGORIES */}
      {activeSubTab === "categories" && (
        <div className="grid-2" style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}>
          
          {/* Categories specification details list */}
          <div className="data-table-card" style={{ padding: "24px" }}>
            <span className="mono" style={{ fontSize: "10.5px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: "16px" }}>
              Active Category Specification Schemas
            </span>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {categories.map(c => (
                <div key={c.id} style={{ borderBottom: "1px solid var(--hairline-2)", paddingBottom: "16px" }}>
                  <h4 style={{ fontWeight: "600", fontSize: "14px", marginBottom: "8px" }}>{c.name}</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {c.customFields && c.customFields.length > 0 ? (
                      c.customFields.map(f => (
                        <div key={f.key} style={{ backgroundColor: "var(--fill)", border: "1px solid var(--hairline)", borderRadius: "4px", padding: "4px 8px", fontSize: "11px" }}>
                          <code className="mono" style={{ color: "var(--accent)" }}>{f.key}</code>
                          <span style={{ color: "var(--text-3)", marginLeft: "4px" }}>({f.label})</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--text-3)" }}>No custom fields. Inherits global default metadata.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category custom specifications builder */}
          <div className="data-table-card" style={{ padding: "20px" }}>
            <h4 className="mono" style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "16px" }}>
              Create Category Schema
            </h4>
            <form onSubmit={handleAddCategorySubmit}>
              <div className="form-group">
                <label>Category Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Headphones"
                  required
                />
              </div>

              {/* Dynamic Specifications field rows */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ margin: 0 }}>Custom Fields (Specifications)</label>
                  <button 
                    type="button" 
                    onClick={handleAddFieldRow}
                    style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "11px", cursor: "pointer", fontWeight: "500" }}
                  >
                    + Add Field
                  </button>
                </div>

                {fields.map((field, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={field.label}
                      onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                      placeholder="Label e.g. Battery Capacity"
                      style={{ flex: 1, padding: "6px 8px", fontSize: "12px" }}
                      required
                    />
                    <input 
                      type="text" 
                      className="form-control mono" 
                      value={field.key}
                      style={{ flex: 1, padding: "6px 8px", fontSize: "12px", color: "var(--text-3)", backgroundColor: "var(--fill)" }}
                      placeholder="key_auto"
                      readOnly
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                <Plus size={14} />
                <span>Save Category Schema</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB C: EMPLOYEE DIRECTORY */}
      {activeSubTab === "directory" && (
        <div className="data-table-card">
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Avatar</th>
                <th>Employee Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Access Level (Role)</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="avatar" style={{ width: "24px", height: "24px", fontSize: "10px" }}>
                      {emp.avatar}
                    </div>
                  </td>
                  <td style={{ fontWeight: "600", color: "var(--ink)" }}>{emp.name}</td>
                  <td className="mono">{emp.email}</td>
                  <td>
                    <select 
                      value={emp.dept}
                      onChange={(e) => promoteEmployeeRole(emp.id, emp.role, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "12px", border: "1px solid var(--hairline)", borderRadius: "4px" }}
                    >
                      <option value="Unassigned">Unassigned</option>
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </td>
                  
                  {/* Privilege directory role dropdown - changes trigger gravity checks */}
                  <td>
                    <select 
                      value={emp.role}
                      onChange={(e) => triggerRoleChange(emp, e.target.value)}
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: "12px", 
                        border: "1px solid var(--hairline)", 
                        borderRadius: "4px",
                        fontWeight: emp.role === "Admin" ? "600" : "normal",
                        color: emp.role === "Admin" ? "var(--accent)" : "inherit"
                      }}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
