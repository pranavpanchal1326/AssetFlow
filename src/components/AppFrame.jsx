import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { 
  Home, 
  Archive, 
  ArrowLeftRight, 
  Calendar, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  ListTodo, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  RotateCcw,
  Menu,
  Sun,
  Moon
} from "lucide-react";

export const AppFrame = ({ children, onSearchQueryChange }) => {
  const {
    currentUser,
    logout,
    currentView,
    setCurrentView,
    employees,
    switchUser,
    resetDatabase,
    ledger,
    theme,
    toggleTheme
  } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcut listener Ctrl+K or Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearchQueryChange) {
      onSearchQueryChange(query);
    }
  };

  if (!currentUser) return <>{children}</>;

  // Count unread ledger notifications
  const unreadCount = ledger.filter(item => item.unread).length;
  
  // Scoped notifications: Overdue (Hot) counts
  const overdueCount = ledger.filter(item => item.unread && item.message.toLowerCase().includes("overdue")).length;
  const normalUnread = unreadCount - overdueCount;

  // Role verification helper
  const role = currentUser.role; // Admin, Manager, Employee

  // Navigation Items with role guards (Section 5 PRD)
  const navItems = [
    { view: "Now", label: "Now", icon: Home, roles: ["Admin", "Manager", "Employee"] },
    { view: "Objects", label: "Objects", icon: Archive, roles: ["Admin", "Manager", "Employee"] },
    { view: "Handoffs", label: "Handoffs", icon: ArrowLeftRight, roles: ["Admin", "Manager", "Employee"] },
    { view: "Bookings", label: "Bookings", icon: Calendar, roles: ["Admin", "Manager", "Employee"] },
    { view: "Care", label: "Care", icon: Wrench, roles: ["Admin", "Manager", "Employee"] },
    { view: "Audits", label: "Audits", icon: ClipboardCheck, roles: ["Admin", "Manager"] },
    { view: "Reports", label: "Reports", icon: BarChart3, roles: ["Admin", "Manager"] },
    { view: "Ledger", label: "Ledger", icon: ListTodo, roles: ["Admin", "Manager", "Employee"] },
    { view: "Setup", label: "Setup", icon: Settings, roles: ["Admin"] }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  const handleNavClick = (viewName) => {
    setCurrentView(viewName);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* 236px Navigation Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header flex-between">
          <div className="flex-align-center">
            <span style={{ color: "var(--accent)", fontWeight: "600" }}>AssetFlow</span>
            <span className="mono" style={{ fontSize: "10px", color: "var(--text-3)", marginLeft: "4px" }}>⌘</span>
          </div>
        </div>

        {/* ⌘K Search Box */}
        <div className="sidebar-search-box">
          <div className="search-input-wrapper">
            <Search size={14} style={{ position: "absolute", left: "10px", color: "var(--text-3)" }} />
            <input 
              id="global-search"
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ paddingLeft: "30px" }}
            />
            <span className="search-shortcut mono">⌘K</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Views</div>
          {filteredNavItems.map(item => {
            const IconComponent = item.icon;
            const isActive = currentView === item.view;
            
            // Show badge counts for Now (overdue) or Ledger (notifications)
            let badge = null;
            if (item.view === "Ledger" && unreadCount > 0) {
              badge = <span className="nav-badge alert">{unreadCount}</span>;
            } else if (item.view === "Now" && overdueCount > 0) {
              badge = <span className="nav-badge alert">{overdueCount}</span>;
            } else if (item.view === "Now" && normalUnread > 0) {
              badge = <span className="nav-badge neutral mono">{normalUnread}</span>;
            }

            return (
              <div 
                key={item.view} 
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavClick(item.view)}
              >
                <div className="nav-icon-label">
                  <IconComponent size={16} />
                  <span>{item.label}</span>
                </div>
                {badge}
              </div>
            );
          })}
        </nav>

        {/* User Footplate */}
        <div className="sidebar-footer">
          <div className="avatar">
            {currentUser.avatar}
          </div>
          <div className="user-info" style={{ flex: 1 }}>
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.role}</span>
          </div>
          <button 
            onClick={logout} 
            title="Sign Out"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="main-wrapper">
        {/* 56px sticky topbar */}
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="btn btn-small mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: "none" }} /* Styled via CSS in @media for tablet/mobile */
            >
              <Menu size={16} />
            </button>
            <span style={{ color: "var(--text-3)" }}>App</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{currentView}</span>
          </div>

          <div className="topbar-actions">
            
            {/* Quick user roles switcher (for demo testing convenience) */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="mono" style={{ fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase" }}>
                Switch User (Demo):
              </span>
              <select 
                value={currentUser.id} 
                onChange={(e) => switchUser(e.target.value)}
                style={{ 
                  padding: "4px 8px", 
                  fontSize: "12px", 
                  backgroundColor: "var(--fill)", 
                  border: "1px solid var(--hairline)", 
                  borderRadius: "4px",
                  cursor: "pointer" 
                }}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Theme toggle */}
            <button
              className="btn btn-small"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle color theme"
              style={{ border: "none", background: "none" }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notification Bell */}
            <button
              className="btn btn-small"
              onClick={() => setCurrentView("Ledger")}
              style={{ position: "relative", border: "none", background: "none" }}
              title={`${unreadCount} Unread Logs`}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span 
                  style={{ 
                    position: "absolute", 
                    top: "-2px", 
                    right: "-2px", 
                    width: "8px", 
                    height: "8px", 
                    backgroundColor: "var(--alert)", 
                    borderRadius: "50%" 
                  }} 
                />
              )}
            </button>

            {/* Database Reset Action */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                className="btn btn-small" 
                onClick={() => resetDatabase(false)}
                title="Reset Database to Seed State"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
              <button 
                className="btn btn-small btn-danger" 
                onClick={() => resetDatabase(true)}
                title="Wipe database to test empty First-run"
                style={{ height: "28px", padding: "4px 8px", fontSize: "11px" }}
              >
                Wipe (Empty Now)
              </button>
            </div>

          </div>
        </header>

        {/* View content injection */}
        <main className="content-container">
          {children}
        </main>
      </div>

      {/* Internal helper styling for mobile menu toggle display */}
      <style>{`
        .mobile-menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-2);
          padding: 4px;
        }
        @media (max-width: 640px) {
          .mobile-menu-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};
