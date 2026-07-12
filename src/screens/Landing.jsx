import React, { useState, useEffect, useRef, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { ConstellationCanvas } from "../components/ConstellationCanvas";
import {
  ArrowRight,
  Activity,
  Eye,
  Sun,
  Moon,
  MousePointer,
  ChevronDown
} from "lucide-react";

export const Landing = ({ onEnterApp }) => {
  const { assets, handoffs, theme, toggleTheme } = useContext(AppContext);
  const [activeStep, setActiveStep] = useState(0);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const containerRef = useRef(null);

  // Update active step based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const height = window.innerHeight || 800;
      const step = Math.min(Math.floor((scrollPos + height / 2) / height), 5);
      setActiveStep(step);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (index) => {
    const height = window.innerHeight || 800;
    window.scrollTo({
      top: index * height,
      behavior: "smooth"
    });
  };

  // HUD steps for scrollytelling
  const hudSteps = [
    { label: "The Void", index: 0 },
    { label: "Interactive Pulse", index: 1 },
    { label: "Custody Flow", index: 2 },
    { label: "Spring Tension", index: 3 },
    { label: "Governance Snaps", index: 4 },
    { label: "Product Bridge", index: 5 }
  ];

  return (
    <div className="landing-hero" ref={containerRef}>
      
      {/* Sticky Premium Topbar Header */}
      <header className="landing-nav">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={18} color="#5E8CFC" style={{ filter: "drop-shadow(0 0 6px #5E8CFC)" }} />
          <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.02em", color: "#FFFFFF" }}>AssetFlow</span>
        </div>
        
        <nav className="landing-nav-links">
          <span className="landing-nav-link" onClick={() => scrollToSection(0)}>Constellation</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(2)}>Flows</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(3)}>Tension</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(5)}>Triage Specs</span>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", height: "36px" }}>
          {/* Theme toggle */}
          <button
            className="btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle color theme"
            style={{
              height: "36px",
              width: "36px",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#E4E4E7"
            }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Primary CTA */}
          <button 
            className="btn btn-primary" 
            onClick={onEnterApp} 
            style={{ 
              height: "36px", 
              fontSize: "12px", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px", 
              justifyContent: "center",
              backgroundColor: "#2C5FE0",
              borderColor: "#2C5FE0",
              color: "#FFFFFF",
              fontWeight: "600",
              boxShadow: "0 0 12px rgba(44, 95, 224, 0.4)"
            }}
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
          pointerEvents: "auto"
        }}
      >
        <ConstellationCanvas activeStep={activeStep} prefersReducedMotion={false} theme={theme} />
      </div>

      {/* Scroll HUD dot navigation */}
      <div className="scroll-hud">
        {hudSteps.map((step) => (
          <div 
            key={step.index}
            className={`scroll-hud-dot ${activeStep === step.index ? "active" : ""}`}
            onClick={() => scrollToSection(step.index)}
            title={step.label}
          />
        ))}
      </div>

      {/* Floating Story Elements */}
      <div className="story-scroll-container">
        
        {/* ACT 1: ARRIVAL — The Void Hero */}
        <section className="story-section" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", paddingLeft: "10%" }}>
          <h1 className="landing-fraunces-headline" style={{ marginBottom: "20px" }}>
            Your inventory<br />is alive.
          </h1>
          
          <p style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.6)", maxWidth: "540px", lineHeight: "1.6", margin: "0 0 32px" }}>
            A dynamic, spring-physics constellation linking physical corporate assets directly to live employee tethers.
          </p>

          <div style={{ display: "flex", gap: "16px" }} className="landing-hero-card">
            <button 
              className="btn btn-primary" 
              onClick={onEnterApp}
              style={{ 
                padding: "0 24px", 
                height: "44px", 
                fontSize: "14px", 
                fontWeight: "600", 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "8px",
                backgroundColor: "#2C5FE0",
                borderColor: "#2C5FE0",
                boxShadow: "0 0 16px rgba(44, 95, 224, 0.5)"
              }}
            >
              <span>Explore Dashboard</span>
              <ArrowRight size={14} />
            </button>
            <button 
              className="btn" 
              onClick={() => setShowBlueprintModal(true)}
              style={{ 
                padding: "0 20px", 
                height: "44px", 
                fontSize: "14px", 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF"
              }}
            >
              <Eye size={14} />
              <span>Technical Specs</span>
            </button>
          </div>

          <div style={{ position: "absolute", bottom: "40px", left: "10%" }} className="cursor-invitation">
            <div className="cursor-invitation-dot" />
            <span>Scroll to Materialize Links</span>
            <ChevronDown size={14} style={{ marginLeft: "4px" }} />
          </div>
        </section>

        {/* ACT 2: DISCOVERY — Interactive Pulse */}
        <section className="story-section" style={{ height: "100vh" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10px", textTransform: "uppercase", color: "#5E8CFC", fontWeight: "600", display: "block", marginBottom: "8px", letterSpacing: "0.06em" }}>
              ACT 2 · THE PULSE
            </span>
            <h2>Responsive Proximity</h2>
            <p>
              Assets aren't spreadsheet rows. Drag, throw, or hover. Move your cursor near any node to witness the proximity fields illuminate live connections.
            </p>
            <div className="cursor-invitation">
              <MousePointer size={12} />
              <span>Hover nodes to test electromagnetic aura</span>
            </div>
          </div>
        </section>

        {/* ACT 3: PERPETUAL MOTION — The Handoff */}
        <section className="story-section" style={{ height: "100vh" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10px", textTransform: "uppercase", color: "#5E8CFC", fontWeight: "600", display: "block", marginBottom: "8px", letterSpacing: "0.06em" }}>
              ACT 3 · PERPETUAL MOTION
            </span>
            <h2>Chain of Custody Flows</h2>
            <p>
              Watch tethers shift dynamically. As assets transfer from person to person, links route themselves in real-time to preserve compliance ledgers.
            </p>
            
            <div className="mini-widget" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="mock-avatar-circle">PS</span>
                <span style={{ fontWeight: "500" }}>Priya</span>
              </div>
              <div className="mono" style={{ color: "#5E8CFC", fontSize: "11px", animation: "blink 1.5s infinite", letterSpacing: "0.04em" }}>
                ── AF-0001 ──▶
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="mock-avatar-circle">RP</span>
                <span style={{ fontWeight: "500" }}>Raj</span>
              </div>
            </div>
          </div>
        </section>

        {/* ACT 4: THE TENSION — Overdue Alert */}
        <section className="story-section" style={{ height: "100vh" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10px", textTransform: "uppercase", color: "#EF4444", fontWeight: "600", display: "block", marginBottom: "8px", letterSpacing: "0.06em" }}>
              ACT 4 · THE TENSION
            </span>
            <h2>Overdue Tension States</h2>
            <p>
              When checkout duration exceeds parameters, spring vectors contract, pulling the visual node tight and pulsing in high-visibility warning crimson.
            </p>

            <div className="mini-widget" style={{ borderColor: "rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.04)", color: "#EF4444", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="brand-pill-dot" style={{ backgroundColor: "#EF4444", boxShadow: "0 0 6px #EF4444" }} />
                <span style={{ fontWeight: "600" }}>AF-0008 Komodo Camera</span>
              </div>
              <span className="mono" style={{ fontWeight: "700" }}>OVERDUE</span>
            </div>
          </div>
        </section>

        {/* ACT 5: GOVERNANCE SNAPS — Lost & Rejection */}
        <section className="story-section" style={{ height: "100vh" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10px", textTransform: "uppercase", color: "#EF4444", fontWeight: "600", display: "block", marginBottom: "8px", letterSpacing: "0.06em" }}>
              ACT 5 · GOVERNANCE
            </span>
            <h2>Collision Prevention</h2>
            <p>
              Two claims on the same asset are physically rejected. Electromagnetic repulsion fields push colliding nodes apart, instantly blocking the collision.
            </p>

            <div className="mini-widget" style={{ borderLeft: "3px solid #EF4444", paddingLeft: "14px" }}>
              <div style={{ fontWeight: "600", color: "#FFFFFF", marginBottom: "4px" }}>Allocation Refused</div>
              <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", margin: 0 }}>Tesla Model 3 is already locked in custody by Priya Sharma.</p>
            </div>
          </div>
        </section>

        {/* ACT 6: PRODUCT BRIDGE — Real-time Stats and Preview */}
        <section className="preview-bridge-section" style={{ zIndex: 10, position: "relative" }}>
          <div className="preview-bridge-card">
            <div className="preview-bridge-header">
              <span className="mock-dot" style={{ backgroundColor: "#FF5F56", width: "8px", height: "8px" }} />
              <span className="mock-dot" style={{ backgroundColor: "#FFBD2E", width: "8px", height: "8px" }} />
              <span className="mock-dot" style={{ backgroundColor: "#27C93F", width: "8px", height: "8px" }} />
              <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.3)", fontFamily: "monospace", marginLeft: "12px" }}>live-operation-bridge // assetflow-triage</span>
            </div>
            
            <div className="preview-bridge-body">
              <h2 className="preview-bridge-title">Precision Triage Operations</h2>
              
              <div className="grid-3">
                <div className="mock-card" style={{ height: "72px", padding: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255,255,255,0.01)" }}>
                  <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.4)", fontWeight: "600", textTransform: "uppercase" }}>Tethered Inventory</span>
                  <span style={{ fontSize: "16px", fontWeight: "600", color: "#FFFFFF", fontFamily: "monospace" }}>{assets.length} Active</span>
                </div>
                <div className="mock-card" style={{ height: "72px", padding: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255,255,255,0.01)" }}>
                  <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.4)", fontWeight: "600", textTransform: "uppercase" }}>Pending Handoffs</span>
                  <span style={{ fontSize: "16px", fontWeight: "600", color: "#5E8CFC", fontFamily: "monospace" }}>{handoffs.filter(h => h.status === "requested").length} Requests</span>
                </div>
                <div className="mock-card" style={{ height: "72px", padding: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255,255,255,0.01)" }}>
                  <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.4)", fontWeight: "600", textTransform: "uppercase" }}>System Load</span>
                  <span style={{ fontSize: "16px", fontWeight: "600", color: "#27C93F", fontFamily: "monospace" }}>99.8% Online</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "16px" }}>
                <div className="mock-table" style={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "6px", marginBottom: "10px", fontSize: "8px", color: "rgba(255, 255, 255, 0.4)", fontWeight: "700", textTransform: "uppercase" }}>
                    <span>Active Handoff ID</span>
                    <span>Status</span>
                  </div>
                  {handoffs.slice(-2).map((h, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span className="mock-badge-tag">AF-{h.assetTag}</span>
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase" }}>{h.status}</span>
                    </div>
                  ))}
                </div>

                <div className="mock-table" style={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.4)", fontWeight: "700", textTransform: "uppercase" }}>Telemetry Density</span>
                  <div className="mock-svg-chart">
                    {[25, 45, 60, 30, 80, 95, 70].map((h, idx) => (
                      <div 
                        key={idx} 
                        className="mock-chart-bar" 
                        style={{ 
                          height: `${h}%`,
                          backgroundColor: idx === 5 ? "#EF4444" : "#2C5FE0"
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Institutional Compliance Footer */}
        <footer className="landing-footer">
          <div className="landing-footer-top">
            <div className="landing-footer-brand">
              <h4>AssetFlow Operations</h4>
              <p style={{ color: "rgba(255, 255, 255, 0.4)" }}>Automated spring-mass chain of custody verification ledger.</p>
            </div>
            <div className="landing-footer-compliance">
              <div className="compliance-badge">SAIF-COMPLIANT</div>
              <div className="compliance-badge">LEDGER-LOCKED v1.5</div>
              <div className="compliance-badge">MASS-ATTRACTION ENGINE</div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>© 2026 AssetFlow Corp. Compliance operational tethers certified.</span>
            <div style={{ display: "flex", gap: "24px" }}>
              <span className="landing-nav-link" onClick={() => scrollToSection(0)}>Top</span>
              <span className="landing-nav-link" onClick={onEnterApp} style={{ color: "#FFF", fontWeight: "600" }}>Launch Dashboard →</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Spec & Blueprint Info Modal */}
      {showBlueprintModal && (
        <div className="modal-overlay" onClick={() => setShowBlueprintModal(false)} style={{ zIndex: 1200 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px", padding: "32px", backgroundColor: "#18181B", borderColor: "rgba(255, 255, 255, 0.1)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#FFFFFF", marginBottom: "16px", fontFamily: "'Fraunces', serif" }}>AssetFlow Specification Blueprint</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "360px", overflowY: "auto", fontSize: "13px", color: "rgba(255, 255, 255, 0.7)" }}>
              <div>
                <strong style={{ color: "#FFFFFF" }}>1. Physics Simulation Engine</strong>
                <p>Calculates dynamic repulsion forces using Coulomb formulas (`minDist = 220px`) and spring attraction tethers along active custody links.</p>
              </div>
              <div>
                <strong style={{ color: "#FFFFFF" }}>2. Staggered Materialization</strong>
                <p>Nodes and connection vectors materialize sequentially during initial loading stages to reduce visual weight.</p>
              </div>
              <div>
                <strong style={{ color: "#FFFFFF" }}>3. Magnetic Proximity</strong>
                <p>Interactive cursor proximity mapping increases electromagnetic node glow and activates attraction nodes upon hover coordinates.</p>
              </div>
              <div>
                <strong style={{ color: "#FFFFFF" }}>4. Consequence Gate Governance</strong>
                <p>Ensures that critical steps require authentication and double validation before ledger entry.</p>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button className="btn btn-primary" onClick={() => setShowBlueprintModal(false)} style={{ backgroundColor: "#2C5FE0" }}>
                <span>Close Spec</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
