import React, { useState, useContext, useEffect } from "react";
import { AppProvider, AppContext } from "./context/AppContext";
import { AppFrame } from "./components/AppFrame";
import { ToastStack } from "./components/ToastStack";
import { Landing } from "./screens/Landing";
import { Login } from "./screens/Login";

import { Now } from "./screens/Now";
import { Objects } from "./screens/Objects";
import { Handoffs } from "./screens/Handoffs";
import { Bookings } from "./screens/Bookings";
import { Care } from "./screens/Care";
import { Audits } from "./screens/Audits";
import { Reports } from "./screens/Reports";
import { Ledger } from "./screens/Ledger";
import { Setup } from "./screens/Setup";

function AppContent() {
  const { currentUser, currentView, booting, loading, error, clearError } = useContext(AppContext);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset login page state on logout (currentUser becomes null)
  useEffect(() => {
    if (!currentUser) {
      setShowLogin(false);
    }
  }, [currentUser]);

  // Handler to coordinate global search query shifts
  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
  };

  // Switch between views when user is logged in
  const renderActiveView = () => {
    switch (currentView) {
      case "Now":
        return <Now />;
      case "Objects":
        return <Objects globalSearchQuery={searchQuery} />;
      case "Handoffs":
        return <Handoffs />;
      case "Bookings":
        return <Bookings />;
      case "Care":
        return <Care />;
      case "Audits":
        return <Audits />;
      case "Reports":
        return <Reports />;
      case "Ledger":
        return <Ledger />;
      case "Setup":
        return <Setup />;
      default:
        return <Now />;
    }
  };

  if (booting) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3, #888)", fontSize: "13px" }}>
        Restoring session…
      </div>
    );
  }

  if (!currentUser) {
    if (showLogin) {
      return (
        <Login
          onBackToLanding={() => setShowLogin(false)}
        />
      );
    }
    return (
      <Landing
        onEnterApp={() => setShowLogin(true)}
      />
    );
  }

  return (
    <AppFrame onSearchQueryChange={handleSearchQueryChange}>
      {error && (
        <div
          style={{
            background: "var(--alert-soft, #fee2e2)",
            color: "var(--alert, #dc2626)",
            border: "1px solid var(--alert, #dc2626)",
            borderRadius: "4px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "12.5px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: 600 }}
          >
            Dismiss
          </button>
        </div>
      )}
      {loading && (
        <div style={{ fontSize: "11px", color: "var(--text-3, #888)", marginBottom: "12px" }}>
          Syncing with server…
        </div>
      )}
      {renderActiveView()}
    </AppFrame>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
      <ToastStack />
    </AppProvider>
  );
}

export default App;
