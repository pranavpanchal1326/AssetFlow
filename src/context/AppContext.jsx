import React, { createContext, useState, useEffect } from "react";
import {
  initialEmployees,
  initialCategories,
  initialAssets,
  initialDepartments,
  initialHandoffs,
  initialBookings,
  initialCareTickets,
  initialAudits,
  initialLedger
} from "../db/mockData";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Load initial data from LocalStorage or seed defaults
  const [employees, setEmployees] = useState(() => {
    const data = localStorage.getItem("af_employees");
    return data ? JSON.parse(data) : initialEmployees;
  });

  const [categories, setCategories] = useState(() => {
    const data = localStorage.getItem("af_categories");
    return data ? JSON.parse(data) : initialCategories;
  });

  const [assets, setAssets] = useState(() => {
    const data = localStorage.getItem("af_assets");
    return data ? JSON.parse(data) : initialAssets;
  });

  const [departments, setDepartments] = useState(() => {
    const data = localStorage.getItem("af_departments");
    return data ? JSON.parse(data) : initialDepartments;
  });

  const [handoffs, setHandoffs] = useState(() => {
    const data = localStorage.getItem("af_handoffs");
    return data ? JSON.parse(data) : initialHandoffs;
  });

  const [bookings, setBookings] = useState(() => {
    const data = localStorage.getItem("af_bookings");
    return data ? JSON.parse(data) : initialBookings;
  });

  const [careTickets, setCareTickets] = useState(() => {
    const data = localStorage.getItem("af_care_tickets");
    return data ? JSON.parse(data) : initialCareTickets;
  });

  const [audits, setAudits] = useState(() => {
    const data = localStorage.getItem("af_audits");
    return data ? JSON.parse(data) : initialAudits;
  });

  const [ledger, setLedger] = useState(() => {
    const data = localStorage.getItem("af_ledger");
    return data ? JSON.parse(data) : initialLedger;
  });

  // Current logged in user (null = landing page)
  const [currentUser, setCurrentUser] = useState(() => {
    const data = localStorage.getItem("af_current_user");
    return data ? JSON.parse(data) : null;
  });

  // Active view switching inside app
  const [currentView, setCurrentView] = useState("Now");

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("af_employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("af_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("af_assets", JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem("af_departments", JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem("af_handoffs", JSON.stringify(handoffs));
  }, [handoffs]);

  useEffect(() => {
    localStorage.setItem("af_bookings", JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem("af_care_tickets", JSON.stringify(careTickets));
  }, [careTickets]);

  useEffect(() => {
    localStorage.setItem("af_audits", JSON.stringify(audits));
  }, [audits]);

  useEffect(() => {
    localStorage.setItem("af_ledger", JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("af_current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("af_current_user");
    }
  }, [currentUser]);

  // Auth helper functions
  const login = (email, password) => {
    const user = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setCurrentView("Now");
      addLedgerEntry("system", `${user.name} logged in successfully`, user.name);
      return { success: true, user };
    }
    return { success: false, error: "Invalid email credentials" };
  };

  const logout = () => {
    if (currentUser) {
      addLedgerEntry("system", `${currentUser.name} logged out`, currentUser.name);
    }
    setCurrentUser(null);
    setCurrentView("Now");
  };

  // Switch role directly for demo testing
  const switchUser = (userId) => {
    const user = employees.find(e => e.id === userId);
    if (user) {
      setCurrentUser(user);
      addLedgerEntry("system", `Demo role switched to ${user.name} (${user.role})`, "System Tester");
    }
  };

  // Add ledger entry
  const addLedgerEntry = (type, message, user) => {
    const newEntry = {
      id: `L-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      user,
      unread: true
    };
    setLedger(prev => [newEntry, ...prev]);
  };

  // Mark all notifications read
  const markLedgerRead = () => {
    setLedger(prev => prev.map(item => ({ ...item, unread: false })));
  };

  // Register Asset
  const registerAsset = (assetData) => {
    // Generate next tag: AF-XXXX
    const currentMax = assets.reduce((max, asset) => {
      const num = parseInt(asset.tag.split("-")[1]);
      return num > max ? num : max;
    }, 0);
    const nextTag = `AF-${String(currentMax + 1).padStart(4, "0")}`;

    const newAsset = {
      tag: nextTag,
      ...assetData,
      status: assetData.heldBy ? "allocated" : "available",
      dateRegistered: new Date().toISOString().split("T")[0]
    };

    setAssets(prev => [...prev, newAsset]);
    addLedgerEntry(
      "system",
      `Registered new asset: ${newAsset.name} (${newAsset.tag}) under ${newAsset.category}`,
      currentUser?.name || "Admin"
    );

    // If allocated on registration, create an approved handoff log
    if (newAsset.heldBy) {
      const newHandoff = {
        id: `H-${Date.now()}`,
        assetTag: nextTag,
        fromEmployeeId: currentUser?.id || "E-4",
        toEmployeeId: newAsset.heldBy,
        status: "approved",
        date: new Date().toISOString(),
        type: "allocation"
      };
      setHandoffs(prev => [...prev, newHandoff]);
    }

    return newAsset;
  };

  // Update Asset details
  const updateAssetDetails = (tag, updatedFields) => {
    setAssets(prev =>
      prev.map(asset => {
        if (asset.tag === tag) {
          return { ...asset, ...updatedFields };
        }
        return asset;
      })
    );
  };

  // Category schema builder
  const addCategory = (categoryName, fields) => {
    const newCat = {
      id: `CAT-${Date.now()}`,
      name: categoryName,
      customFields: fields
    };
    setCategories(prev => [...prev, newCat]);
    addLedgerEntry("system", `Created custom asset category: ${categoryName}`, currentUser?.name || "Admin");
  };

  // Handoff Request & Approvals
  const requestHandoff = (assetTag, toEmployeeId, type) => {
    const asset = assets.find(a => a.tag === assetTag);
    if (!asset) return { success: false, error: "Asset not found" };

    // Validations:
    // If allocated/maint and it's an allocation request -> trigger Refusal
    if (type === "allocation" && asset.status !== "available") {
      const holder = employees.find(e => e.id === asset.heldBy);
      return { 
        success: false, 
        error: "refusal", 
        reason: `${holder ? holder.name : "Someone"} currently holds this asset.`,
        holderId: asset.heldBy
      };
    }

    const newHandoff = {
      id: `H-${Date.now()}`,
      assetTag,
      fromEmployeeId: asset.heldBy || currentUser?.id,
      toEmployeeId,
      status: "requested",
      date: new Date().toISOString(),
      type
    };

    setHandoffs(prev => [...prev, newHandoff]);
    
    const requesterName = employees.find(e => e.id === toEmployeeId)?.name || "Employee";
    const assetName = asset.name;
    addLedgerEntry(
      "handoff",
      `Handoff request raised: ${type} of ${assetName} to ${requesterName}`,
      currentUser?.name || requesterName
    );

    return { success: true };
  };

  const approveHandoff = (handoffId) => {
    const handoff = handoffs.find(h => h.id === handoffId);
    if (!handoff) return;

    const asset = assets.find(a => a.tag === handoff.assetTag);
    if (!asset) return;

    const receiverName = employees.find(e => e.id === handoff.toEmployeeId)?.name || "Employee";
    
    // Update asset state based on handoff type
    let nextStatus = "allocated";
    let nextHeldBy = handoff.toEmployeeId;

    if (handoff.type === "return") {
      nextStatus = "available";
      nextHeldBy = null;
    }

    setAssets(prev =>
      prev.map(a => {
        if (a.tag === asset.tag) {
          return { ...a, status: nextStatus, heldBy: nextHeldBy, overdueSince: null };
        }
        return a;
      })
    );

    setHandoffs(prev =>
      prev.map(h => {
        if (h.id === handoffId) {
          return { ...h, status: "approved" };
        }
        return h;
      })
    );

    addLedgerEntry(
      "handoff",
      `Handoff approved: ${asset.name} is now ${handoff.type === "return" ? "returned and available" : `in the hands of ${receiverName}`}`,
      currentUser?.name || "Admin"
    );
  };

  const declineHandoff = (handoffId) => {
    setHandoffs(prev =>
      prev.map(h => {
        if (h.id === handoffId) {
          return { ...h, status: "declined" };
        }
        return h;
      })
    );
    const handoff = handoffs.find(h => h.id === handoffId);
    const assetName = assets.find(a => a.tag === handoff?.assetTag)?.name || "Asset";
    addLedgerEntry(
      "handoff",
      `Handoff declined: transfer of ${assetName} was refused`,
      currentUser?.name || "Admin"
    );
  };

  // Booking scheduler overlap checking (Section 7)
  const addBooking = (bookingData) => {
    const { assetTag, employeeId, startTime, endTime } = bookingData;
    
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    // Overlap rule: newStart < existingEnd && newEnd > existingStart
    const overlapping = bookings.find(b => {
      if (b.assetTag !== assetTag || b.status !== "approved") return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return newStart < bEnd && newEnd > bStart;
    });

    if (overlapping) {
      const booker = employees.find(e => e.id === overlapping.employeeId)?.name || "Another user";
      return { 
        success: false, 
        error: "overlap",
        reason: `Reserved by ${booker} during this slot.`,
        overlapping
      };
    }

    const newBooking = {
      id: `B-${Date.now()}`,
      assetTag,
      employeeId,
      startTime,
      endTime,
      status: "approved"
    };

    setBookings(prev => [...prev, newBooking]);
    
    // Set asset status to reserved if booking is active now
    const now = new Date();
    if (now >= newStart && now <= newEnd) {
      setAssets(prev =>
        prev.map(a => (a.tag === assetTag ? { ...a, status: "reserved" } : a))
      );
    }

    const assetName = assets.find(a => a.tag === assetTag)?.name || "Asset";
    const requesterName = employees.find(e => e.id === employeeId)?.name || "Employee";
    addLedgerEntry(
      "system",
      `Reserved ${assetName} for ${requesterName} from ${newStart.toLocaleDateString()} to ${newEnd.toLocaleDateString()}`,
      requesterName
    );

    return { success: true };
  };

  // Care Work Tickets Kanban
  const addCareTicket = (ticketData) => {
    const newTicket = {
      id: `C-${Date.now()}`,
      assetTag: ticketData.assetTag,
      issue: ticketData.issue,
      priority: ticketData.priority,
      status: "pending",
      assigneeId: null,
      date: new Date().toISOString()
    };

    setCareTickets(prev => [...prev, newTicket]);
    
    const assetName = assets.find(a => a.tag === ticketData.assetTag)?.name || "Asset";
    addLedgerEntry(
      "system",
      `Raised Care maintenance request for ${assetName}: "${ticketData.issue}"`,
      currentUser?.name || "Employee"
    );
  };

  const updateCareTicketStatus = (ticketId, nextStatus, assigneeId = null) => {
    setCareTickets(prev =>
      prev.map(ticket => {
        if (ticket.id === ticketId) {
          const updated = { ...ticket, status: nextStatus };
          if (assigneeId !== null) {
            updated.assigneeId = assigneeId;
          }
          return updated;
        }
        return ticket;
      })
    );

    const ticket = careTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Side effect on asset state:
    // If Approved/Assigned/In Progress -> Under Maintenance (status: "maint")
    // If Resolved -> Available (status: "available", heldBy: null)
    let assetStatus = null;
    if (["approved", "assigned", "in_progress"].includes(nextStatus)) {
      assetStatus = "maint";
    } else if (nextStatus === "resolved") {
      assetStatus = "available";
    }

    if (assetStatus) {
      setAssets(prev =>
        prev.map(a => {
          if (a.tag === ticket.assetTag) {
            return { 
              ...a, 
              status: assetStatus, 
              heldBy: nextStatus === "resolved" ? null : a.heldBy 
            };
          }
          return a;
        })
      );
    }

    const assetName = assets.find(a => a.tag === ticket.assetTag)?.name || "Asset";
    addLedgerEntry(
      "system",
      `Care ticket for ${assetName} moved to '${nextStatus}'`,
      currentUser?.name || "System"
    );
  };

  // Audits checklists and Consequence Gates (Section 7)
  const createAuditCycle = (auditData) => {
    const targetDept = departments.find(d => d.id === auditData.scopeDeptDeptId)?.name || "All Departments";
    
    // Select assets belonging to employees of this department
    const targetEmployeeIds = employees
      .filter(e => e.dept === targetDept)
      .map(e => e.id);

    const targetAssets = assets.filter(a => targetEmployeeIds.includes(a.heldBy));

    const newAudit = {
      id: `A-${Date.now()}`,
      title: auditData.title,
      scopeDept: targetDept,
      startDate: new Date().toISOString().split("T")[0],
      endDate: auditData.endDate,
      status: "active",
      checklist: targetAssets.map(a => ({
        assetTag: a.tag,
        status: "pending",
        notes: ""
      }))
    };

    setAudits(prev => [...prev, newAudit]);
    addLedgerEntry("system", `Created audit cycle '${newAudit.title}' targeting ${targetDept}`, currentUser?.name || "Admin");
  };

  const updateAuditCheckItem = (auditId, assetTag, status, notes) => {
    setAudits(prev =>
      prev.map(audit => {
        if (audit.id === auditId) {
          const updatedChecklist = audit.checklist.map(item => {
            if (item.assetTag === assetTag) {
              return { ...item, status, notes };
            }
            return item;
          });
          return { ...audit, checklist: updatedChecklist };
        }
        return audit;
      })
    );
  };

  // Close audit and run Consequence Gate (Section 7)
  const closeAuditCycle = (auditId) => {
    const audit = audits.find(a => a.id === auditId);
    if (!audit) return;

    // Process consequence gate checklist items:
    // Any asset marked "missing" is globally set to "lost/alert" and heldBy = null
    // Any asset marked "damaged" triggers an automatic Care work order and status = "maint"
    const missingAssets = audit.checklist.filter(item => item.status === "missing");
    const damagedAssets = audit.checklist.filter(item => item.status === "damaged");

    setAssets(prev =>
      prev.map(asset => {
        const missingMatch = missingAssets.find(m => m.assetTag === asset.tag);
        const damagedMatch = damagedAssets.find(d => d.assetTag === asset.tag);

        if (missingMatch) {
          return { ...asset, status: "alert", heldBy: null, overdueSince: new Date().toISOString() };
        }
        if (damagedMatch) {
          return { ...asset, status: "maint" };
        }
        return asset;
      })
    );

    // Auto-generate Care tickets for damaged assets
    damagedAssets.forEach(item => {
      const asset = assets.find(a => a.tag === item.assetTag);
      addCareTicket({
        assetTag: item.assetTag,
        issue: `Auto-raised from Audit [${audit.title}]: Damaged asset reported. Note: ${item.notes || "None"}`,
        priority: "normal"
      });
    });

    setAudits(prev =>
      prev.map(a => (a.id === auditId ? { ...a, status: "completed" } : a))
    );

    addLedgerEntry(
      "system",
      `Audit cycle '${audit.title}' finalized. Missing assets marked lost. Damaged assets sent to Care.`,
      currentUser?.name || "Admin"
    );
  };

  // Setup promoter and department modifiers
  const promoteEmployeeRole = (employeeId, newRole, departmentName) => {
    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id === employeeId) {
          return { ...emp, role: newRole, dept: departmentName };
        }
        return emp;
      })
    );
    const empName = employees.find(e => e.id === employeeId)?.name || "Employee";
    addLedgerEntry("system", `Promoted ${empName} to ${newRole} in ${departmentName}`, currentUser?.name || "Admin");
  };

  const addDepartment = (name, headId, parentId = null) => {
    const newDept = {
      id: `D-${Date.now()}`,
      name,
      headEmployeeId: headId,
      parentId,
      status: "active"
    };
    setDepartments(prev => [...prev, newDept]);
    addLedgerEntry("system", `Added department: ${name}`, currentUser?.name || "Admin");
  };

  // Reset database for first-run empty test demonstration
  const resetDatabase = (clearAll = false) => {
    if (clearAll) {
      setEmployees(initialEmployees);
      setCategories(initialCategories);
      setAssets([]);
      setDepartments(initialDepartments);
      setHandoffs([]);
      setBookings([]);
      setCareTickets([]);
      setAudits([]);
      setLedger([]);
      setCurrentUser(initialEmployees.find(e => e.role === "Admin")); // Auto-select admin
      addLedgerEntry("system", "Demo Database cleared. Guided Empty Now view initialized.", "System Seeder");
    } else {
      localStorage.clear();
      setEmployees(initialEmployees);
      setCategories(initialCategories);
      setAssets(initialAssets);
      setDepartments(initialDepartments);
      setHandoffs(initialHandoffs);
      setBookings(initialBookings);
      setCareTickets(initialCareTickets);
      setAudits(initialAudits);
      setLedger(initialLedger);
      setCurrentUser(initialEmployees.find(e => e.role === "Admin"));
      addLedgerEntry("system", "Demo Database reset to fully seeded state.", "System Seeder");
    }
  };

  return (
    <AppContext.Provider
      value={{
        employees,
        categories,
        assets,
        departments,
        handoffs,
        bookings,
        careTickets,
        audits,
        ledger,
        currentUser,
        currentView,
        setCurrentView,
        login,
        logout,
        switchUser,
        registerAsset,
        updateAssetDetails,
        addCategory,
        requestHandoff,
        approveHandoff,
        declineHandoff,
        addBooking,
        addCareTicket,
        updateCareTicketStatus,
        createAuditCycle,
        updateAuditCheckItem,
        closeAuditCycle,
        promoteEmployeeRole,
        addDepartment,
        resetDatabase,
        markLedgerRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
