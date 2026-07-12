import React, { useState, useEffect, useRef } from "react";
import { ConstellationCanvas } from "../components/ConstellationCanvas";
import { 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Compass, 
  Lock, 
  Eye, 
  FileText,
  UserCheck,
  Sun,
  Moon,
  Search,
  Terminal,
  Calendar,
  Wrench,
  CheckSquare
} from "lucide-react";

export const Landing = ({ onEnterApp }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [theme, setTheme] = useState("light");
  const [commandQuery, setCommandQuery] = useState("");
  const containerRef = useRef(null);

  // Sync theme with body/HTML document attribute
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Command Palette global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const scrollToSection = (index) => {
    const height = window.innerHeight || 800;
    window.scrollTo({
      top: index * height,
      behavior: "smooth"
    });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const commandPaletteItems = [
    { label: "Enter AssetFlow App", shortcut: "Enter", action: onEnterApp },
    { label: `Toggle Theme (Currently ${theme === "light" ? "Light" : "Dark"})`, shortcut: "⌘T", action: toggleTheme },
    { label: "View Technical Blueprint Spec", shortcut: "⌘B", action: () => { setShowBlueprintModal(true); setShowCommandPalette(false); } },
    { label: "Scroll to Living Constellation", shortcut: "1", action: () => { scrollToSection(0); setShowCommandPalette(false); } },
    { label: "Scroll to Atom 1: Handoffs", shortcut: "2", action: () => { scrollToSection(1); setShowCommandPalette(false); } },
    { label: "Scroll to Atom 2: Overdue alert", shortcut: "3", action: () => { scrollToSection(2); setShowCommandPalette(false); } },
    { label: "Scroll to Atom 4: Conflict Refusal", shortcut: "4", action: () => { scrollToSection(4); setShowCommandPalette(false); } }
  ];

  const filteredCommandItems = commandPaletteItems.filter(item => 
    item.label.toLowerCase().includes(commandQuery.toLowerCase())
  );

  return (
    <div className="landing-hero" ref={containerRef}>
      
      {/* Sticky Premium Topbar Header */}
      <header className="landing-nav" style={{ height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={18} color="var(--accent)" />
          <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.02em" }}>AssetFlow</span>
        </div>
        
        <nav className="landing-nav-links">
          <span className="landing-nav-link" onClick={() => scrollToSection(0)}>Constellation</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(1)}>Handoffs</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(2)}>Overdue</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(4)}>Governance</span>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", height: "36px" }}>
          {/* Quick-Search Search Trigger Button */}
          <button 
            className="btn" 
            onClick={() => setShowCommandPalette(true)}
            style={{ height: "36px", padding: "0 12px", fontSize: "12px", gap: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Search size={12} />
            <span style={{ color: "var(--text-3)" }}>Search</span>
            <kbd className="cmd-palette-shortcut" style={{ fontSize: "8px", padding: "1px 4px" }}>Ctrl+K</kbd>
          </button>

          {/* Sun/Moon Theme Switcher Toggle */}
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              height: "36px", 
              width: "36px", 
              border: "1px solid var(--hairline)", 
              borderRadius: "6px", 
              backgroundColor: "var(--fill)", 
              color: "var(--ink)", 
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button 
            className="btn" 
            onClick={() => setShowBlueprintModal(true)}
            style={{ height: "36px", fontSize: "12px", borderStyle: "dashed", display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }}
          >
            <FileText size={12} />
            <span>Blueprint</span>
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={onEnterApp} 
            style={{ height: "36px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }}
          >
            <span>Enter App</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </header>

      {/* Sticky Fullscreen Constellation Canvas background */}
      <div 
        className="constellation-wrapper" 
        style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          width: "100vw", 
          height: "100vh", 
          zIndex: 1,
          filter: "none",
          transition: "filter 0.4s ease"
        }}
      >
        <ConstellationCanvas activeStep={activeStep} prefersReducedMotion={false} />
      </div>

      {/* Floating Story Elements */}
      <div className="story-scroll-container" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Section 0: Hero Title & App Preview Mockup (Split screen layout) */}
        <section className="story-section" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 40px 20px" }}>
          
          <div className="hero-split-container" style={{ display: "flex", flexDirection: "row", gap: "48px", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "1200px", zIndex: 10, pointerEvents: "none" }}>
            
            {/* Left: Text Card */}
            <div 
              className="landing-hero-card"
              style={{ 
                pointerEvents: "auto", 
                textAlign: "left",
                flex: "1",
                maxWidth: "520px",
                padding: "36px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--hairline)",
                borderRadius: "8px",
                boxShadow: "var(--shadow-premium)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "16px",
                marginBottom: 0
              }}
            >
              {/* Brand Pill Badge */}
              <div className="brand-pill" style={{ marginBottom: "0px" }}>
                <span className="brand-pill-dot" />
                <span>Introducing AssetFlow v1.0</span>
              </div>

              <h1 style={{ margin: 0, fontSize: "40px", fontWeight: "700", lineHeight: "1.15", letterSpacing: "-0.035em" }}>Every object has a person.</h1>
              <p style={{ fontSize: "14px", color: "var(--text-2)", margin: 0, lineHeight: "1.5" }}>
                A real-time spring physics constellation that tethers your physical inventory directly to live corporate custody.
              </p>
              
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button 
                  className="btn btn-primary" 
                  onClick={onEnterApp}
                  style={{ padding: "0 20px", height: "38px", fontSize: "13px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span>Enter AssetFlow</span>
                  <ArrowRight size={13} />
                </button>
                <button 
                  className="btn" 
                  onClick={() => setShowBlueprintModal(true)}
                  style={{ padding: "0 16px", height: "38px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Eye size={13} />
                  <span>Blueprint Specs</span>
                </button>
              </div>
            </div>

            {/* Right: Mockup Card */}
            <div style={{ flex: "1.2", maxWidth: "620px", width: "100%", pointerEvents: "auto" }}>
              <div className="desktop-mockup" style={{ marginTop: "0px", transition: "var(--transition-slow)" }}>
                <div className="desktop-mockup-header" style={{ height: "36px", borderBottom: "1px solid var(--hairline)" }}>
                  <span className="mock-dot" style={{ backgroundColor: "#FF5F56", width: "8px", height: "8px" }} />
                  <span className="mock-dot" style={{ backgroundColor: "#FFBD2E", width: "8px", height: "8px" }} />
                  <span className="mock-dot" style={{ backgroundColor: "#27C93F", width: "8px", height: "8px" }} />
                  <span style={{ fontSize: "10px", color: "var(--text-3)", fontFamily: "monospace", marginLeft: "12px" }}>http://localhost:5173/dashboard</span>
                </div>
                <div className="desktop-mockup-body" style={{ height: "240px" }}>
                  
                  {/* Mock Sidebar with Lucide Icons */}
                  <div className="mock-sidebar" style={{ width: "140px", padding: "16px 12px", borderRight: "1px solid var(--hairline)", backgroundColor: "var(--surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "20px", marginBottom: "12px", opacity: 0.85 }}>
                      <Terminal size={12} color="var(--accent)" />
                      <div style={{ height: "6px", width: "50px", backgroundColor: "var(--text-3)", borderRadius: "2px" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "20px", marginBottom: "12px", opacity: 0.4 }}>
                      <Calendar size={12} />
                      <div style={{ height: "6px", width: "45px", backgroundColor: "var(--text-3)", borderRadius: "2px" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "20px", marginBottom: "12px", opacity: 0.4 }}>
                      <Wrench size={12} />
                      <div style={{ height: "6px", width: "40px", backgroundColor: "var(--text-3)", borderRadius: "2px" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "20px", opacity: 0.4 }}>
                      <CheckSquare size={12} />
                      <div style={{ height: "6px", width: "45px", backgroundColor: "var(--text-3)", borderRadius: "2px" }} />
                    </div>
                  </div>

                  {/* Mock Dashboard Area */}
                  <div className="mock-content" style={{ padding: "16px", gap: "12px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    <div className="mock-topbar" style={{ height: "24px", display: "flex", alignItems: "center", padding: "0 8px", fontSize: "10px", color: "var(--text-3)", fontWeight: "500", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}>
                      <span>Triage Dashboard</span>
                    </div>
                    
                    {/* 3 KPI Widgets */}
                    <div className="mock-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                      <div className="mock-card" style={{ height: "54px", padding: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}>
                        <span style={{ fontSize: "7px", color: "var(--text-3)", fontWeight: "600", textTransform: "uppercase" }}>Active Custody</span>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink)", fontFamily: "monospace" }}>14 Assets</span>
                      </div>
                      <div className="mock-card" style={{ height: "54px", padding: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}>
                        <span style={{ fontSize: "7px", color: "var(--text-3)", fontWeight: "600", textTransform: "uppercase" }}>Overdue Warning</span>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--alert)", fontFamily: "monospace" }}>2 Overdue</span>
                      </div>
                      <div className="mock-card" style={{ height: "54px", padding: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}>
                        <span style={{ fontSize: "7px", color: "var(--text-3)", fontWeight: "600", textTransform: "uppercase" }}>Audit Health</span>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--available)", fontFamily: "monospace" }}>96.5% Acc</span>
                      </div>
                    </div>
                    
                    {/* Mock Table and SVG Chart */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", flex: 1, minHeight: 0 }}>
                      <div className="mock-table" style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--hairline-2)", paddingBottom: "4px", fontSize: "7px", color: "var(--text-3)", fontWeight: "600", textTransform: "uppercase" }}>
                          <span>Asset</span>
                          <span>Custodian</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="mock-badge-tag" style={{ fontSize: "8px", padding: "1px 4px", border: "1px dotted var(--accent)", color: "var(--accent)", backgroundColor: "var(--accent-soft)", borderRadius: "2px" }}>AF-0001</span>
                          <div className="mock-person-row" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px" }}>
                            <span className="mock-avatar-circle" style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "var(--fill)", border: "1px solid var(--hairline)", fontSize: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>PS</span>
                            <span>Priya</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="mock-badge-tag" style={{ fontSize: "8px", padding: "1px 4px", border: "1px dotted var(--alert)", color: "var(--alert)", backgroundColor: "var(--alert-soft)", borderRadius: "2px" }}>AF-0008</span>
                          <div className="mock-person-row" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px" }}>
                            <span className="mock-avatar-circle" style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "var(--fill)", border: "1px solid var(--hairline)", fontSize: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>ER</span>
                            <span>Elena</span>
                          </div>
                        </div>
                      </div>

                      <div className="mock-table" style={{ padding: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "4px" }}>
                        <span style={{ fontSize: "7px", color: "var(--text-3)", fontWeight: "600", textTransform: "uppercase" }}>Weekly Density</span>
                        
                        <div className="mock-svg-chart" style={{ display: "flex", alignItems: "flex-end", height: "48px", gap: "6px", width: "100%", paddingTop: "4px" }}>
                          {[30, 55, 20, 75, 45, 90, 35].map((h, idx) => (
                            <div 
                              key={idx} 
                              className="mock-chart-bar" 
                              style={{ 
                                flex: 1,
                                height: `${h}%`, 
                                backgroundColor: idx === 5 ? "var(--alert)" : "var(--accent)",
                                borderTopLeftRadius: "2px",
                                borderTopRightRadius: "2px"
                              }} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>

          <div style={{ marginTop: "20px", fontSize: "10.5px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.055em", animation: "pulse-red 2s infinite" }}>
            Scroll down to inspect active custody tethers
          </div>
        </section>

        {/* Section 1: Handoff closeup */}
        <section className="story-section" style={{ height: "100vh", display: "flex", alignItems: "center" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10.5px", textTransform: "uppercase", color: "var(--accent)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              ATOM 1 · THE HANDOFF
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>Custody in Perpetual Motion</h2>
            <p style={{ color: "var(--text-2)", fontSize: "13px", lineHeight: "1.6", marginBottom: "0" }}>
              An organization's assets aren't static rows. They flow continuously from person to person. 
              Watch the highlighted node transition its tether from Priya to Raj as the transaction logs.
            </p>
            
            {/* Interactive Widget */}
            <div className="mini-widget" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="table-avatar">PS</span>
                <span style={{ fontWeight: "500" }}>Priya</span>
              </div>
              <div className="mono" style={{ color: "var(--accent)", fontSize: "11px", animation: "blink 1.5s infinite" }}>
                ── AF-0001 ──▶
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="table-avatar">RP</span>
                <span style={{ fontWeight: "500" }}>Raj</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Overdue alert */}
        <section className="story-section" style={{ height: "100vh", display: "flex", alignItems: "center" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10.5px", textTransform: "uppercase", color: "var(--alert)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              ATOM 2 · THE TENSION
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>Overdue Warning States</h2>
            <p style={{ color: "var(--text-2)", fontSize: "13px", lineHeight: "1.6", marginBottom: "0" }}>
              When an asset exceeds its approved custody duration, the physical springs in the constellation pull tight.
              The tether pulses in alert red to visually flag administrative neglect.
            </p>

            {/* Interactive Widget */}
            <div className="mini-widget" style={{ borderColor: "var(--alert)", backgroundColor: "var(--alert-soft)", color: "var(--alert)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="status-dot alert" />
                <span style={{ fontWeight: "600" }}>AF-0008 Komodo Camera</span>
              </div>
              <span className="mono" style={{ fontWeight: "600" }}>OVERDUE (3.2d)</span>
            </div>
          </div>
        </section>

        {/* Section 3: Snapping threads */}
        <section className="story-section" style={{ height: "100vh", display: "flex", alignItems: "center" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10.5px", textTransform: "uppercase", color: "var(--text-3)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              ATOM 3 · THE SNAP
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>Unlinked or Lost Assets</h2>
            <p style={{ color: "var(--text-2)", fontSize: "13px", lineHeight: "1.6", marginBottom: "0" }}>
              If custody is severed or an item is declared lost, the node snaps away from its human anchors, 
              drifting slowly to the periphery of the canvas until a new search event re-establishes link lock.
            </p>

            {/* Interactive Widget */}
            <div className="mini-widget" style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-3)" }}>
              <span style={{ fontSize: "11px", padding: "2px 6px", border: "1px dashed var(--hairline)" }}>Severed Link</span>
              <span className="mono">AF-0005 ↛ [No Custodian]</span>
            </div>
          </div>
        </section>

        {/* Section 4: Allocation refusals */}
        <section className="story-section" style={{ height: "100vh", display: "flex", alignItems: "center" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10.5px", textTransform: "uppercase", color: "var(--accent)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              ATOM 4 · GOVERNANCE
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>Allocation Conflict Rejection</h2>
            <p style={{ color: "var(--text-2)", fontSize: "13px", lineHeight: "1.6", marginBottom: "0" }}>
              The system prevents double-booking and active custody clashes by establishing physical repulsion fields.
              Two users trying to claim the same asset are pushed apart, visually blocking the collision.
            </p>

            {/* Interactive Widget */}
            <div className="mini-widget" style={{ borderLeft: "3px solid var(--alert)" }}>
              <div style={{ fontWeight: "600", color: "var(--ink)", marginBottom: "4px" }}>Allocation Refused</div>
              <p style={{ fontSize: "11.5px", color: "var(--text-2)", margin: 0 }}>Tesla Model 3 is already held in custody by Priya Sharma.</p>
            </div>
          </div>
        </section>

        {/* Section 5: Institutional Compliance Footer */}
        <footer className="landing-footer">
          <div className="landing-footer-top">
            <div className="landing-footer-brand">
              <h4>AssetFlow</h4>
              <p style={{ color: "#8E8E93" }}>Secure ledger chain of custody operations.</p>
            </div>
            <div className="landing-footer-compliance">
              <div className="compliance-badge">SAIF-COMPLIANT</div>
              <div className="compliance-badge">LEDGER-LOCKED v1.0</div>
              <div className="compliance-badge">SPRING-MASS SIMULATOR</div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>© 2026 AssetFlow Operations. All rights reserved.</span>
            <div style={{ display: "flex", gap: "24px" }}>
              <span className="landing-nav-link" onClick={() => scrollToSection(0)}>Back to Top</span>
              <span className="landing-nav-link" onClick={onEnterApp} style={{ color: "#FFF", fontWeight: "600" }}>Enter App →</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Spec & Blueprint Info Modal */}
      {showBlueprintModal && (
        <div className="modal-overlay" onClick={() => setShowBlueprintModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px", padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--ink)", marginBottom: "12px" }}>AssetFlow UI Blueprint Specs</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "360px", overflowY: "auto", fontSize: "13px", color: "var(--text-2)" }}>
              <div>
                <strong style={{ color: "var(--ink)" }}>1. Physics Simulation Engine</strong>
                <p>Calculates dynamic repulsion forces using Coulomb formulas (`minDist = 220px`) and spring attraction tethers along active custody links.</p>
              </div>
              <div>
                <strong style={{ color: "var(--ink)" }}>2. Strict Color Neutrality (95%)</strong>
                <p>Restricted to cool neutral tones (`#FBFBFA` canvas, `#FFFFFF` surface). Accent alerts are reserved for overdue or lost items.</p>
              </div>
              <div>
                <strong style={{ color: "var(--ink)" }}>3. Layout & Density Guidelines</strong>
                <p>Table rows locked to exactly `40px` height with right-aligned tabular dates. Overflow strings are clipped via ellipsis to prevent row wrapping.</p>
              </div>
              <div>
                <strong style={{ color: "var(--ink)" }}>4. Consequence Gate Governance</strong>
                <p>Ensures that critical steps require authentication and double validation before ledger entry.</p>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button className="btn btn-primary" onClick={() => setShowBlueprintModal(false)}>
                <span>Close Blueprint</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Command Palette ⌘K Overlay Modal */}
      {showCommandPalette && (
        <div className="modal-overlay" onClick={() => setShowCommandPalette(false)} style={{ backgroundColor: "rgba(24, 24, 27, 0.3)" }}>
          <div className="cmd-palette-wrapper" onClick={(e) => e.stopPropagation()}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} style={{ position: "absolute", left: "20px", color: "var(--text-3)" }} />
              <input 
                type="text"
                className="cmd-palette-input"
                placeholder="Type a command or search sections..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                autoFocus
                style={{ paddingLeft: "48px" }}
              />
            </div>
            <div className="cmd-palette-results">
              {filteredCommandItems.length > 0 ? (
                filteredCommandItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="cmd-palette-item"
                    onClick={() => {
                      item.action();
                      setShowCommandPalette(false);
                    }}
                  >
                    <span>{item.label}</span>
                    <kbd className="cmd-palette-shortcut">{item.shortcut}</kbd>
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
                  No matching command results found.
                </div>
              )}
            </div>
            <div style={{ height: "32px", borderTop: "1px solid var(--hairline-2)", backgroundColor: "var(--fill)", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 16px", fontSize: "10px", color: "var(--text-3)" }}>
              <span>Press <kbd className="cmd-palette-shortcut" style={{ fontSize: "8px", padding: "1px 4px" }}>Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
