export const initialEmployees = [
  { id: "E-1", name: "Priya Sharma", role: "Employee", dept: "Engineering", email: "priya@assetflow.com", avatar: "PS" },
  { id: "E-2", name: "Raj Patel", role: "Employee", dept: "Engineering", email: "raj@assetflow.com", avatar: "RP" },
  { id: "E-3", name: "Vikram Singh", role: "Manager", dept: "Operations", email: "vikram@assetflow.com", avatar: "VS" },
  { id: "E-4", name: "Sarah Jenkins", role: "Admin", dept: "Operations", email: "sarah@assetflow.com", avatar: "SJ" },
  { id: "E-5", name: "Elena Rostova", role: "Employee", dept: "Design", email: "elena@assetflow.com", avatar: "ER" },
  { id: "E-6", name: "Chloe Dubois", role: "Manager", dept: "Design", email: "chloe@assetflow.com", avatar: "CD" }
];

export const initialCategories = [
  { 
    id: "CAT-1", 
    name: "Laptops", 
    customFields: [
      { key: "RAM", label: "RAM (GB)", type: "text" },
      { key: "Storage", label: "Storage (GB)", type: "text" },
      { key: "CPU", label: "Processor", type: "text" }
    ] 
  },
  { 
    id: "CAT-2", 
    name: "Cameras", 
    customFields: [
      { key: "Resolution", label: "Max Resolution", type: "text" },
      { key: "Lens Type", label: "Lens Mount", type: "text" }
    ] 
  },
  { 
    id: "CAT-3", 
    name: "Vehicles", 
    customFields: [
      { key: "License Plate", label: "Plate Number", type: "text" },
      { key: "Model Year", label: "Year of Manufacture", type: "text" }
    ] 
  },
  { 
    id: "CAT-4", 
    name: "Projectors", 
    customFields: [
      { key: "Aspect Ratio", label: "Native Aspect Ratio", type: "text" }
    ] 
  }
];

export const initialAssets = [
  { 
    tag: "AF-0001", 
    name: "MacBook Pro 16\"", 
    category: "Laptops", 
    serial: "C02DG543MD6R", 
    status: "allocated", 
    heldBy: "E-1", 
    location: "HQ - Floor 3", 
    condition: "excellent", 
    bookable: false, 
    cost: 2499, 
    dateRegistered: "2025-01-10", 
    customFields: { RAM: "32GB", Storage: "1TB", CPU: "M3 Max" } 
  },
  { 
    tag: "AF-0002", 
    name: "ThinkPad P16", 
    category: "Laptops", 
    serial: "PF43D9A2", 
    status: "allocated", 
    heldBy: "E-2", 
    location: "HQ - Floor 3", 
    condition: "good", 
    bookable: false, 
    cost: 1899, 
    dateRegistered: "2025-02-15", 
    customFields: { RAM: "16GB", Storage: "512GB", CPU: "Intel i7" } 
  },
  { 
    tag: "AF-0003", 
    name: "Sony FX3 Cine Camera", 
    category: "Cameras", 
    serial: "8394028", 
    status: "available", 
    heldBy: null, 
    location: "Media Room", 
    condition: "excellent", 
    bookable: true, 
    cost: 3899, 
    dateRegistered: "2025-03-01", 
    customFields: { Resolution: "4K", "Lens Type": "E-Mount" } 
  },
  { 
    tag: "AF-0004", 
    name: "Tesla Model 3", 
    category: "Vehicles", 
    serial: "5YJ3E1EA5KF83940", 
    status: "allocated", 
    heldBy: "E-3", 
    location: "Garage Bay A", 
    condition: "excellent", 
    bookable: true, 
    cost: 39999, 
    dateRegistered: "2024-11-20", 
    customFields: { "License Plate": "CA-9382F", "Model Year": "2024" } 
  },
  { 
    tag: "AF-0005", 
    name: "Epson Pro Projector", 
    category: "Projectors", 
    serial: "EPS-93829", 
    status: "reserved", 
    heldBy: null, 
    location: "Conf Room 4B", 
    condition: "good", 
    bookable: true, 
    cost: 1200, 
    dateRegistered: "2025-05-02", 
    customFields: { "Aspect Ratio": "16:9" } 
  },
  { 
    tag: "AF-0006", 
    name: "iPad Pro 12.9\"", 
    category: "Laptops", 
    serial: "DLXG839K", 
    status: "maint", 
    heldBy: null, 
    location: "IT Desk", 
    condition: "fair", 
    bookable: false, 
    cost: 1099, 
    dateRegistered: "2024-08-12", 
    customFields: { RAM: "8GB", Storage: "256GB", CPU: "M2" } 
  },
  { 
    tag: "AF-0007", 
    name: "Dell XPS 15", 
    category: "Laptops", 
    serial: "DL-9382-XPS", 
    status: "available", 
    heldBy: null, 
    location: "HQ - Floor 4", 
    condition: "excellent", 
    bookable: false, 
    cost: 1799, 
    dateRegistered: "2025-04-18", 
    customFields: { RAM: "16GB", Storage: "512GB", CPU: "Intel i9" } 
  },
  { 
    tag: "AF-0008", 
    name: "Red Komodo 6K", 
    category: "Cameras", 
    serial: "RED-KM-8392", 
    status: "alert", // Represents overdue/conflict
    heldBy: "E-5", 
    location: "Out of Office", 
    condition: "good", 
    bookable: true, 
    cost: 5995, 
    dateRegistered: "2025-03-20", 
    customFields: { Resolution: "6K", "Lens Type": "RF Mount" },
    overdueSince: "2026-07-05T18:00:00Z" // Date it was due back
  }
];

export const initialDepartments = [
  { id: "D-1", name: "Engineering", headEmployeeId: "E-4", parentId: null, status: "active" },
  { id: "D-2", name: "Operations", headEmployeeId: "E-3", parentId: null, status: "active" },
  { id: "D-3", name: "Design", headEmployeeId: "E-6", parentId: "D-1", status: "active" }
];

export const initialHandoffs = [
  { id: "H-1", assetTag: "AF-0001", fromEmployeeId: "E-4", toEmployeeId: "E-1", status: "approved", date: "2026-07-01T10:00:00Z", type: "allocation" },
  { id: "H-2", assetTag: "AF-0002", fromEmployeeId: "E-4", toEmployeeId: "E-2", status: "approved", date: "2026-07-02T11:00:00Z", type: "allocation" },
  { id: "H-3", assetTag: "AF-0008", fromEmployeeId: "E-4", toEmployeeId: "E-5", status: "approved", date: "2026-06-10T09:00:00Z", type: "allocation" },
  { id: "H-4", assetTag: "AF-0003", fromEmployeeId: "E-2", toEmployeeId: "E-1", status: "requested", date: "2026-07-11T16:30:00Z", type: "transfer" }
];

export const initialBookings = [
  { id: "B-1", assetTag: "AF-0003", employeeId: "E-1", startTime: "2026-07-13T09:00:00", endTime: "2026-07-13T12:00:00", status: "approved" },
  { id: "B-2", assetTag: "AF-0004", employeeId: "E-2", startTime: "2026-07-14T10:00:00", endTime: "2026-07-14T17:00:00", status: "approved" }
];

export const initialCareTickets = [
  { id: "C-1", assetTag: "AF-0006", issue: "Screen flickering on brightness above 80%", priority: "normal", status: "assigned", assigneeId: "E-4", date: "2026-07-11T10:00:00Z" }
];

export const initialAudits = [
  { 
    id: "A-1", 
    title: "Q3 Engineering Asset Audit", 
    scopeDept: "Engineering", 
    startDate: "2026-07-05", 
    endDate: "2026-07-15", 
    status: "active", 
    checklist: [
      { assetTag: "AF-0001", status: "verified", notes: "Excellent condition, held by Priya" },
      { assetTag: "AF-0002", status: "verified", notes: "Good condition, held by Raj" },
      { assetTag: "AF-0007", status: "pending", notes: "" }
    ] 
  }
];

export const initialLedger = [
  { id: "L-1", timestamp: "2026-07-12T04:30:00Z", type: "system", message: "Audit 'Q3 Engineering Asset Audit' created by Sarah Jenkins", user: "Sarah Jenkins", unread: false },
  { id: "L-2", timestamp: "2026-07-12T05:00:00Z", type: "handoff", message: "Transfer request raised: Sony FX3 Cine Camera from Raj Patel to Priya Sharma", user: "Priya Sharma", unread: true }
];
