import React, { useState, useContext, useEffect } from "react";
import { AppProvider, AppContext } from "./context/AppContext";
import { AppFrame } from "./components/AppFrame";
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
  const { currentUser, currentView } = useContext(AppContext);
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
      {renderActiveView()}
    </AppFrame>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
