import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  authApi, setToken, getToken,
  assetsApi, departmentsApi, categoriesApi, usersApi,
  allocationsApi, transfersApi, bookingsApi, maintenanceApi,
  auditsApi, notificationsApi,
} from "../api/client";

export const AppContext = createContext();

// ---------------------------------------------------------------------------
// Mapping layer: backend shapes (capitalized enums, numeric ids, holder_user_id
// style fields) <-> the frontend shape the existing screens already expect
// (lowercase statuses, `tag` as the asset key, `heldBy`, `dept` as a name, etc).
// ---------------------------------------------------------------------------

const ROLE_BACKEND_TO_UI = { admin: "Admin", asset_manager: "Manager", dept_head: "Manager", employee: "Employee" };
const ROLE_UI_TO_BACKEND = { Admin: "admin", Manager: "asset_manager", Employee: "employee" };

const ASSET_STATUS_TO_UI = {
  Available: "available",
  Allocated: "allocated",
  Reserved: "reserved",
  "Under Maintenance": "maint",
  Lost: "alert",
  Retired: "disposed",
  Disposed: "disposed",
};
const ASSET_STATUS_TO_BACKEND = {
  available: "Available",
  allocated: "Allocated",
  reserved: "Reserved",
  maint: "Under Maintenance",
  alert: "Lost",
  disposed: "Disposed",
  registered: "Available",
};

const CONDITION_TO_UI = { New: "excellent", Good: "good", Fair: "fair", Poor: "poor" };
const CONDITION_TO_BACKEND = { excellent: "New", good: "Good", fair: "Fair", poor: "Poor" };

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "AF";
}

export const AppProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [careTickets, setCareTickets] = useState([]);
  const [audits, setAudits] = useState([]);
  const [ledger, setLedger] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("Now");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booting, setBooting] = useState(true);

  // ---- Toasts (in-app, non-blocking — replaces native alert() popups) --------
  const [toasts, setToasts] = useState([]);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const pushToast = useCallback((message, type = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 4500);
  }, [dismissToast]);

  // ---- Theme (global, persisted — used on Landing, Login, and the app shell) --
  const [theme, setTheme] = useState(() => localStorage.getItem("af_theme") || "dark");
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("af_theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // ---- Shapers -------------------------------------------------------

  const shapeEmployee = useCallback((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: ROLE_BACKEND_TO_UI[u.role] || "Employee",
    roleRaw: u.role,
    departmentId: u.departmentId,
    dept: departments.find((d) => d.rawId === u.departmentId)?.name
      || departments.find((d) => d.id === u.departmentId)?.name
      || "Unassigned",
    avatar: initials(u.name),
    status: u.status,
  }), [departments]);

  const shapeDepartment = useCallback((d) => ({
    id: d.id,
    rawId: d.id,
    name: d.name,
    headEmployeeId: d.headUserId,
    parentId: d.parentId,
    status: d.status || "active",
  }), []);

  // Seed data (data/categories.json) stores custom field definitions keyed by
  // "name", but the UI (and newly-created categories from Setup) key them by
  // "key". Normalize here so every consumer can rely on field.key existing
  // and being unique — this was also the source of a React duplicate-key
  // warning on the Objects screen (every field fell back to the same
  // undefined key).
  const shapeCategory = useCallback((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    customFields: (c.customFields || []).map((f, i) => ({
      key: f.key || f.name || `field_${i}`,
      label: f.label || f.key || f.name || `Field ${i + 1}`,
      type: f.type || "text",
    })),
  }), []);

  // assets need allocation data merged in (heldBy / overdueSince)
  const shapeAsset = useCallback((a, allocByAsset, categoriesList) => {
    const alloc = allocByAsset ? allocByAsset[a.id] : null;
    const cat = (categoriesList || categories).find((c) => c.id === a.categoryId);
    return {
      id: a.id,
      tag: a.tag,
      name: a.name,
      categoryId: a.categoryId,
      category: cat ? cat.name : "Uncategorized",
      serial: a.serialNo || "",
      status: ASSET_STATUS_TO_UI[a.status] || "available",
      statusRaw: a.status,
      heldBy: alloc ? alloc.holderUserId : null,
      heldByDept: alloc ? alloc.holderDepartmentId : null,
      location: a.location || "",
      condition: CONDITION_TO_UI[a.condition] || "good",
      bookable: !!a.isBookable,
      cost: a.acquisitionCost || 0,
      dateRegistered: (a.acquisitionDate || a.createdAt || "").slice(0, 10),
      customFields: a.customValues || {},
      overdueSince: alloc && alloc.overdue ? alloc.expectedReturnDate : null,
      activeAllocationId: alloc ? alloc.id : null,
      photoUrl: a.photoUrl || null,
    };
  }, [categories]);

  const shapeBooking = useCallback((b) => ({
    id: b.id,
    assetTag: assets.find((a) => a.id === b.assetId)?.tag || String(b.assetId),
    assetId: b.assetId,
    employeeId: b.bookedBy,
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.cancelled ? "cancelled" : "approved",
  }), [assets]);

  const shapeCareTicket = useCallback((m) => ({
    id: m.id,
    assetTag: assets.find((a) => a.id === m.assetId)?.tag || String(m.assetId),
    assetId: m.assetId,
    issue: m.issue,
    priority: (m.priority || "Medium").toLowerCase() === "high" ? "high" : "normal",
    priorityRaw: m.priority,
    status: m.status === "pending" ? "pending"
      : m.status === "approved" ? "assigned"
      : m.status === "assigned" ? "assigned"
      : m.status === "in_progress" ? "in_progress"
      : m.status === "resolved" ? "resolved"
      : m.status === "rejected" ? "resolved"
      : "pending",
    statusRaw: m.status,
    assigneeId: null,
    date: m.createdAt,
  }), [assets]);

  // ---- Fetch-all ------------------------------------------------------

  const findAssetTag = (assetId, assetList) => (assetList || assets).find((a) => a.id === assetId)?.tag || String(assetId);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptsRaw, catsRaw, usersRaw, assetsRaw, allocsRaw, transfersRaw, bookingsRaw, maintRaw, auditsRaw, notifsRaw] =
        await Promise.all([
          departmentsApi.list(),
          categoriesApi.list(),
          usersApi.list(),
          assetsApi.list(),
          allocationsApi.list(),
          transfersApi.list(),
          bookingsApi.list(),
          maintenanceApi.list(),
          auditsApi.list(),
          notificationsApi.list(),
        ]);

      const depts = deptsRaw.map(shapeDepartment);
      const cats = catsRaw.map(shapeCategory);

      const allocByAsset = {};
      for (const al of allocsRaw) {
        if (al.status === "active") allocByAsset[al.assetId] = al;
      }
      const assetsShaped = assetsRaw.map((a) => shapeAsset(a, allocByAsset, cats));

      const emps = usersRaw.map((u) => ({
        ...u,
        _dept: depts.find((d) => d.id === u.departmentId)?.name || "Unassigned",
      })).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email || "",
        role: ROLE_BACKEND_TO_UI[u.role] || "Employee",
        roleRaw: u.role,
        departmentId: u.departmentId,
        dept: u._dept,
        avatar: initials(u.name),
        status: u.status,
      }));

      // Handoffs: transfer_requests are the real "pending approval" flow.
      const transferHandoffs = transfersRaw.map((t) => ({
        id: `T-${t.id}`,
        rawId: t.id,
        kind: "transfer",
        assetTag: findAssetTag(t.assetId, assetsShaped),
        fromEmployeeId: null, // resolved lazily below via allocation history if needed
        toEmployeeId: t.toUserId,
        status: t.status === "requested" ? "requested" : t.status === "approved" ? "approved" : "declined",
        date: t.createdAt,
        type: "transfer",
      }));
      // Allocations that are active represent completed "allocation" handoffs.
      const allocationHandoffs = allocsRaw.map((al) => ({
        id: `A-${al.id}`,
        rawId: al.id,
        kind: "allocation",
        assetTag: findAssetTag(al.assetId, assetsShaped),
        fromEmployeeId: null,
        toEmployeeId: al.holderUserId,
        status: "approved",
        date: al.allocatedAt,
        type: al.status === "returned" ? "return" : "allocation",
      }));
      const handoffsShaped = [...allocationHandoffs, ...transferHandoffs].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const bookingsShaped = bookingsRaw.map((b) => ({
        id: b.id,
        assetTag: findAssetTag(b.assetId, assetsShaped),
        assetId: b.assetId,
        employeeId: b.bookedBy,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.cancelled ? "cancelled" : "approved",
      }));

      const careShaped = maintRaw.map((m) => ({
        id: m.id,
        assetTag: findAssetTag(m.assetId, assetsShaped),
        assetId: m.assetId,
        issue: m.issue,
        priority: (m.priority || "Medium").toLowerCase() === "high" ? "high" : "normal",
        priorityRaw: m.priority,
        status: m.status === "pending" ? "pending"
          : (m.status === "approved" || m.status === "assigned") ? "assigned"
          : m.status === "in_progress" ? "in_progress"
          : m.status === "resolved" ? "resolved"
          : m.status === "rejected" ? "resolved"
          : "pending",
        statusRaw: m.status,
        assigneeId: null,
        date: m.createdAt,
      }));

      // GET /audits (list) omits items — each cycle's checklist requires the
      // detail endpoint. This was previously missing, so every audit always
      // showed 0/0 items regardless of real data.
      const auditDetails = await Promise.all(
        auditsRaw.map((c) => auditsApi.get(c.id).catch(() => null))
      );
      const auditsShaped = auditsRaw.map((c, i) => ({
        id: c.id,
        title: c.name,
        scopeDept: depts.find((d) => d.id === c.scopeDepartmentId)?.name || "All Departments",
        scopeDeptId: c.scopeDepartmentId,
        startDate: (c.startDate || c.createdAt || "").slice(0, 10),
        endDate: (c.endDate || "").slice(0, 10),
        status: c.status === "closed" ? "completed" : "active",
        checklist: ((auditDetails[i] && auditDetails[i].items) || []).map((it) => ({
          assetTag: findAssetTag(it.assetId, assetsShaped),
          assetId: it.assetId,
          itemId: it.id,
          status: it.result === "pending" ? "pending" : it.result,
          notes: it.note || "",
        })),
      }));

      const ledgerShaped = notifsRaw.notifications.map((n) => ({
        id: n.id,
        timestamp: n.createdAt,
        type: n.type.includes("transfer") || n.type.includes("assigned") ? "handoff" : "system",
        message: `${n.title}: ${n.body}`,
        user: currentUser?.name || "System",
        unread: !n.isRead,
        rawId: n.id,
      }));

      setDepartments(depts);
      setCategories(cats);
      setEmployees(emps);
      setAssets(assetsShaped);
      setHandoffs(handoffsShaped);
      setBookings(bookingsShaped);
      setCareTickets(careShaped);
      setAudits(auditsShaped);
      setLedger(ledgerShaped);
    } catch (err) {
      setError(err.message || "Failed to load data from the server");
    } finally {
      setLoading(false);
    }
  }, [shapeDepartment, shapeCategory, shapeAsset, currentUser]);

  // ---- Boot: restore session from stored token -------------------------
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const { user } = await authApi.me();
        setCurrentUser({
          id: user.id,
          name: user.name,
          email: user.email,
          role: ROLE_BACKEND_TO_UI[user.role] || "Employee",
          roleRaw: user.role,
          departmentId: user.departmentId,
          avatar: initials(user.name),
        });
      } catch (_) {
        setToken(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Once we have a user, load all app data.
  useEffect(() => {
    if (currentUser) refreshAll();
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Auth -------------------------------------------------------------

  const login = async (email, password) => {
    try {
      const { token, user } = await authApi.login(email, password);
      setToken(token);
      setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: ROLE_BACKEND_TO_UI[user.role] || "Employee",
        roleRaw: user.role,
        departmentId: user.departmentId,
        avatar: initials(user.name),
      });
      setCurrentView("Now");
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message || "Invalid email or password" };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const { token, user } = await authApi.signup(name, email, password);
      setToken(token);
      setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: "Employee",
        roleRaw: user.role,
        departmentId: user.departmentId,
        avatar: initials(user.name),
      });
      setCurrentView("Now");
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Could not create account" };
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    setEmployees([]); setCategories([]); setAssets([]); setDepartments([]);
    setHandoffs([]); setBookings([]); setCareTickets([]); setAudits([]); setLedger([]);
    setCurrentView("Now");
  };

  // No real impersonation endpoint exists on the backend. "switchUser" is
  // repurposed as a demo-only quick login using the seeded account's known
  // demo password, clearly distinct from an admin-only role assignment.
  const DEMO_PASSWORDS = { admin: "Admin@123" }; // default for everyone else is Password@123
  const switchUser = async (userId) => {
    const target = employees.find((e) => String(e.id) === String(userId));
    if (!target) return;
    const password = target.roleRaw === "admin" ? "Admin@123" : "Password@123";
    await login(target.email, password);
  };

  // ---- Assets -------------------------------------------------------------

  const registerAsset = async (assetData) => {
    try {
      const category = categories.find((c) => c.name === assetData.category);
      const created = await assetsApi.create({
        name: assetData.name,
        categoryId: category ? category.id : null,
        serialNo: assetData.serial,
        acquisitionCost: assetData.cost,
        location: assetData.location,
        condition: CONDITION_TO_BACKEND[assetData.condition] || "Good",
        isBookable: !!assetData.bookable,
        customValues: assetData.customFields || {},
      });
      if (assetData.heldBy) {
        try {
          await allocationsApi.create({ assetId: created.id, holderUserId: assetData.heldBy });
        } catch (_) { /* leave available if allocation fails */ }
      }
      await refreshAll();
      return { success: true, tag: created.tag };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateAssetDetails = async (tag, updatedFields) => {
    const asset = assets.find((a) => a.tag === tag);
    if (!asset) return { success: false, error: "Asset not found" };
    try {
      const payload = {};
      if (updatedFields.name !== undefined) payload.name = updatedFields.name;
      if (updatedFields.location !== undefined) payload.location = updatedFields.location;
      if (updatedFields.condition !== undefined) payload.condition = CONDITION_TO_BACKEND[updatedFields.condition];
      if (updatedFields.bookable !== undefined) payload.isBookable = updatedFields.bookable;
      if (updatedFields.customFields !== undefined) payload.customValues = updatedFields.customFields;
      if (updatedFields.status !== undefined) payload.status = ASSET_STATUS_TO_BACKEND[updatedFields.status];
      await assetsApi.update(asset.id, payload);
      await refreshAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const uploadAssetPhoto = async (tag, file) => {
    const asset = assets.find((a) => a.tag === tag);
    if (!asset || !file) return { success: false, error: "Nothing to upload" };
    try {
      await assetsApi.uploadPhoto(asset.id, file);
      await refreshAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const addCategory = async (categoryName, fields) => {
    try {
      await categoriesApi.create({ name: categoryName, customFields: fields });
      await refreshAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ---- Handoffs (allocations + transfers) ---------------------------------

  const requestHandoff = async (assetTag, toEmployeeId, type) => {
    const asset = assets.find((a) => a.tag === assetTag);
    if (!asset) return { success: false, error: "Asset not found" };

    try {
      if (type === "allocation") {
        await allocationsApi.create({ assetId: asset.id, holderUserId: toEmployeeId });
        await refreshAll();
        return { success: true };
      }
      if (type === "transfer") {
        await transfersApi.create({ assetId: asset.id, toUserId: toEmployeeId });
        await refreshAll();
        return { success: true };
      }
      if (type === "return") {
        if (!asset.activeAllocationId) return { success: false, error: "This asset has no active allocation to return" };
        await allocationsApi.return(asset.activeAllocationId);
        await refreshAll();
        return { success: true };
      }
      return { success: false, error: "Unknown handoff type" };
    } catch (err) {
      if (err.status === 409) {
        const holder = employees.find((e) => e.id === err.payload?.holder?.id);
        return {
          success: false,
          error: "refusal",
          reason: err.message,
          holderId: err.payload?.holder?.id ?? holder?.id ?? null,
        };
      }
      return { success: false, error: err.message };
    }
  };

  const approveHandoff = async (handoffId) => {
    const h = handoffs.find((x) => x.id === handoffId);
    if (!h || h.kind !== "transfer") return { success: false, error: "Not a pending transfer" };
    try {
      await transfersApi.decide(h.rawId, "approve");
      await refreshAll();
      pushToast("Transfer approved.", "success");
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const declineHandoff = async (handoffId) => {
    const h = handoffs.find((x) => x.id === handoffId);
    if (!h || h.kind !== "transfer") return { success: false, error: "Not a pending transfer" };
    try {
      await transfersApi.decide(h.rawId, "reject");
      await refreshAll();
      pushToast("Transfer declined.", "info");
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ---- Bookings -------------------------------------------------------------

  const addBooking = async (bookingData) => {
    const asset = assets.find((a) => a.tag === bookingData.assetTag);
    if (!asset) return { success: false, error: "Asset not found" };
    try {
      await bookingsApi.create({
        assetId: asset.id,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        purpose: bookingData.purpose || "",
      });
      await refreshAll();
      return { success: true };
    } catch (err) {
      if (err.status === 409) {
        const conflict = err.payload?.conflict;
        return {
          success: false,
          error: "overlap",
          reason: err.message,
          overlapping: conflict ? { employeeId: conflict.bookedBy } : null,
        };
      }
      return { success: false, error: err.message, reason: err.message };
    }
  };

  // ---- Care / maintenance -----------------------------------------------

  const addCareTicket = async (ticketData, photoFile) => {
    const asset = assets.find((a) => a.tag === ticketData.assetTag);
    if (!asset) return { success: false, error: "Asset not found" };
    try {
      await maintenanceApi.create({
        assetId: asset.id,
        issue: ticketData.issue,
        priority: ticketData.priority === "high" ? "High" : "Medium",
      }, photoFile);
      await refreshAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateCareTicketStatus = async (ticketId, nextStatus) => {
    const ticket = careTickets.find((t) => t.id === ticketId);
    if (!ticket) return { success: false, error: "Ticket not found" };
    // Map the frontend kanban progression onto the backend action state machine.
    const actionFromStatus = {
      assigned: ticket.statusRaw === "pending" ? "approve" : "assign",
      in_progress: "start",
      resolved: "resolve",
      pending: null,
    };
    const action = actionFromStatus[nextStatus];
    if (!action) {
      pushToast("This ticket can't move backward — the backend workflow is one-way.", "warning");
      return { success: false, error: "No reverse action available" };
    }
    try {
      const payload = { action };
      if (action === "assign") { payload.technicianName = "Assigned Technician"; payload.technicianContact = "internal"; }
      await maintenanceApi.update(ticket.id, payload);
      await refreshAll();
      pushToast(`Ticket moved to ${nextStatus.replace("_", " ")}.`, "success");
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ---- Audits -------------------------------------------------------------

  const createAuditCycle = async (auditData) => {
    try {
      const auditorIds = employees
        .filter((e) => ["Admin", "Manager"].includes(e.role))
        .map((e) => e.id);
      const created = await auditsApi.create({
        name: auditData.title,
        scopeDepartmentId: auditData.scopeDeptDeptId || null,
        endDate: auditData.endDate,
        auditorIds: auditorIds.length ? auditorIds : [currentUser?.id],
      });
      await refreshAll();
      return { success: true, id: created.id };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateAuditCheckItem = async (auditId, assetTag, status, notes) => {
    const audit = audits.find((a) => a.id === auditId);
    if (!audit) return { success: false, error: "Audit not found" };
    const item = audit.checklist.find((c) => c.assetTag === assetTag);
    if (!item) return { success: false, error: "Checklist item not found" };
    const resultMap = { verified: "verified", damaged: "damaged", missing: "missing" };
    try {
      await auditsApi.updateItem(auditId, item.itemId, { result: resultMap[status] || "verified", note: notes });
      await refreshAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const closeAuditCycle = async (auditId) => {
    try {
      await auditsApi.close(auditId);
      await refreshAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ---- Setup / directory ----------------------------------------------------

  const promoteEmployeeRole = async (employeeId, newRole, departmentName) => {
    try {
      const dept = departments.find((d) => d.name === departmentName);
      await usersApi.update(employeeId, {
        role: ROLE_UI_TO_BACKEND[newRole] || undefined,
        departmentId: dept ? dept.id : undefined,
      });
      await refreshAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const addDepartment = async (name, headId, parentId = null) => {
    try {
      const parentDept = departments.find((d) => d.name === parentId || d.id === parentId);
      await departmentsApi.create({
        name,
        headUserId: headId || null,
        parentId: parentDept ? parentDept.id : null,
      });
      await refreshAll();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ---- Ledger / notifications -------------------------------------------

  const addLedgerEntry = () => { /* server generates notifications as a side-effect of actions now */ };

  const markLedgerRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setLedger((prev) => prev.map((item) => ({ ...item, unread: false })));
    } catch (_) { /* non-fatal */ }
  };

  // Demo reset: re-fetch from the server (the seed script is the real reset).
  const resetDatabase = async () => {
    await refreshAll();
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
        loading,
        error,
        booting,
        theme,
        toggleTheme,
        toasts,
        pushToast,
        dismissToast,
        clearError: () => setError(null),
        login,
        signup,
        logout,
        switchUser,
        registerAsset,
        updateAssetDetails,
        uploadAssetPhoto,
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
        addLedgerEntry,
        markLedgerRead,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
