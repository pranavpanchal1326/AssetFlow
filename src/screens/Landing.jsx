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
  UserCheck
} from "lucide-react";

export const Landing = ({ onEnterApp }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const height = window.innerHeight || 800;
      const step = Math.round(scrollY / height);
      // We have 5 sections (0: Hero, 1: Handoff, 2: Overdue, 3: Lost, 4: Refusal, 5: Footer)
      setActiveStep(Math.min(5, Math.max(0, step)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (index) => {
    const height = window.innerHeight || 800;
    window.scrollTo({
      top: index * height,
      behavior: "smooth"
    });
  };

  return (
    <div className="landing-hero" ref={containerRef} style={{ height: "650vh" }}>
      
      {/* Sticky Premium Topbar Header */}
      <header className="landing-nav">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={18} color="var(--accent)" />
          <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.02em" }}>AssetFlow</span>
          <span className="compliance-badge" style={{ fontSize: "9px", padding: "2px 6px" }}>MNC-GRADE</span>
        </div>
        
        <nav className="landing-nav-links">
          <span className="landing-nav-link" onClick={() => scrollToSection(0)}>Constellation</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(1)}>Handoffs</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(2)}>Overdue</span>
          <span className="landing-nav-link" onClick={() => scrollToSection(4)}>Governance</span>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            className="btn" 
            onClick={() => setShowBlueprintModal(true)}
            style={{ height: "32px", fontSize: "12px", borderStyle: "dashed" }}
          >
            <FileText size={12} />
            <span>Blueprint</span>
          </button>
          <button className="btn btn-primary" onClick={onEnterApp} style={{ height: "32px", fontSize: "12px" }}>
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
          zIndex: 1 
        }}
      >
        <ConstellationCanvas activeStep={activeStep} prefersReducedMotion={false} />
      </div>

      {/* Floating Story Elements */}
      <div className="story-scroll-container" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Section 0: Hero Title & App Preview Mockup */}
        <section className="story-section" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "100px 20px 20px" }}>
          <div className="landing-headline-group" style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            
            {/* Brand Pill Badge */}
            <div className="brand-pill">
              <span className="brand-pill-dot" />
              <span>Introducing AssetFlow v1.0</span>
            </div>

            <h1 style={{ fontSize: "40px", fontWeight: "700", color: "var(--ink)", marginBottom: "16px", letterSpacing: "-0.02em", textAlign: "center" }}>
              Every object has a person.
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-2)", marginBottom: "28px", maxWidth: "500px", textAlign: "center", lineHeight: "1.5" }}>
              A real-time spring physics constellation that tethers your physical inventory directly to live corporate custody.
            </p>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="btn btn-primary" 
                onClick={onEnterApp}
                style={{ padding: "12px 28px", height: "auto", fontSize: "14px", fontWeight: "600" }}
              >
                <span>Enter AssetFlow</span>
                <ArrowRight size={14} />
              </button>
              <button 
                className="btn" 
                onClick={() => setShowBlueprintModal(true)}
                style={{ padding: "12px 24px", height: "auto", fontSize: "14px" }}
              >
                <Eye size={14} />
                <span>Specs & Blueprint</span>
              </button>
            </div>

            {/* Desktop Mockup Preview Frame */}
            <div className="desktop-mockup">
              <div className="desktop-mockup-header">
                <span className="mock-dot" style={{ backgroundColor: "#FF5F56" }} />
                <span className="mock-dot" style={{ backgroundColor: "#FFBD2E" }} />
                <span className="mock-dot" style={{ backgroundColor: "#27C93F" }} />
                <span style={{ fontSize: "10.5px", color: "var(--text-3)", fontFamily: "monospace", marginLeft: "12px" }}>http://localhost:5173/dashboard</span>
              </div>
              <div className="desktop-mockup-body">
                <div className="mock-sidebar">
                  <div className="mock-sidebar-item active" style={{ width: "40px" }} />
                  <div className="mock-sidebar-item" />
                  <div className="mock-sidebar-item" />
                  <div className="mock-sidebar-item" style={{ marginTop: "auto" }} />
                </div>
                <div className="mock-content">
                  <div className="mock-topbar" />
                  <div className="mock-grid">
                    <div className="mock-card">
                      <span style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-3)" }}>ACTIVE CUSTODY</span>
                      <span style={{ fontSize: "18px", fontWeight: "600", color: "var(--ink)" }}>14 Assets</span>
                    </div>
                    <div className="mock-card">
                      <span style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-3)" }}>OVERDUE STATUS</span>
                      <span style={{ fontSize: "18px", fontWeight: "600", color: "var(--alert)" }}>2 Overdue</span>
                    </div>
                    <div className="mock-card">
                      <span style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-3)" }}>ACTIVE AUDIT</span>
                      <span style={{ fontSize: "18px", fontWeight: "600", color: "var(--available)" }}>96.5% Acc</span>
                    </div>
                  </div>
                  <div className="mock-table">
                    <div className="mock-table-row" style={{ width: "60%", height: "8px" }} />
                    <div className="mock-table-row" style={{ width: "80%" }} />
                    <div className="mock-table-row" style={{ width: "70%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "32px", fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.055em", animation: "pulse-red 2s infinite" }}>
              Scroll down to inspect active custody tethers
            </div>
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
        <footer className="landing-footer" style={{ minHeight: "50vh", display: "flex", justifyContent: "flex-end" }}>
          <div className="landing-footer-top">
            <div className="landing-footer-brand">
              <h4>AssetFlow</h4>
              <p style={{ color: "#8E8E93" }}>MNC-grade chain of custody operations.</p>
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

    </div>
  );
};
