import React, { useState, useEffect, useRef } from "react";
import { ConstellationCanvas } from "../components/ConstellationCanvas";

export const Landing = ({ onEnterApp }) => {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const height = window.innerHeight || 800;
      const step = Math.round(scrollY / height);
      setActiveStep(Math.min(5, Math.max(0, step)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-hero" ref={containerRef} style={{ height: "600vh" }}>
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
        
        {/* Section 0: Title & Entry */}
        <section className="story-section" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textShadow: "0 2px 8px rgba(255, 255, 255, 0.4)" }}>
          <div 
            className="landing-headline-group" 
            style={{ 
              pointerEvents: "auto", 
              textAlign: "center",
              maxWidth: "540px",
              padding: "40px 48px",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--hairline)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-medium)"
            }}
          >
            <h1 style={{ fontSize: "36px", fontWeight: "600", color: "var(--ink)", marginBottom: "16px", letterSpacing: "-0.015em" }}>
              Every object has a person.
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-2)", marginBottom: "32px", fontStyle: "italic", lineHeight: "1.5" }}>
              AssetFlow just never lets you forget whose hands it's in.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={onEnterApp}
              style={{ padding: "12px 24px", height: "auto", fontSize: "14px", fontWeight: "600" }}
            >
              Enter AssetFlow
            </button>
            <div style={{ marginTop: "48px", fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.055em", animation: "pulse-red 2s infinite" }}>
              Scroll down to descend into the organism
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
              An organization's assets aren't static lists. They are in continuous flow from hand to hand. 
              AssetFlow maps these paths in real-time. Transfers write themselves into history as objects 
              are released and received. Priya releases, Raj accepts — the ledger accounts for both.
            </p>
          </div>
        </section>

        {/* Section 2: Overdue tension */}
        <section className="story-section" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10.5px", textTransform: "uppercase", color: "var(--alert)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              ATOM 2 · OVERDUE TUG
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px", color: "var(--alert)" }}>Calm Default, Heat Where Earned</h2>
            <p style={{ color: "var(--text-2)", fontSize: "13px", lineHeight: "1.6", marginBottom: "0" }}>
              No unnecessary warning indicators. The design runs 90% neutral. But when an asset is overdue or 
              in conflict, the connection goes warm and pulls tight. The tension is literal — highlighting responsibility 
              without accusations.
            </p>
          </div>
        </section>

        {/* Section 3: Lost snap */}
        <section className="story-section" style={{ height: "100vh", display: "flex", alignItems: "center" }}>
          <div className="story-card" style={{ borderLeft: "3px solid var(--alert)" }}>
            <span className="mono" style={{ fontSize: "10.5px", textTransform: "uppercase", color: "var(--alert)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              ATOM 3 · THE SNAP
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>The Sensation of Loss</h2>
            <p style={{ color: "var(--text-2)", fontSize: "13px", lineHeight: "1.6", marginBottom: "20px" }}>
              When an asset is unaccounted for during periodic audits, the thread snaps. The node floats 
              free and drifts alone. Unsettling and physical — exactly what losing capital feels like.
            </p>
            <div className="consequence-warning-box" style={{ margin: 0, fontSize: "12px" }}>
              <strong>Consequence Gate Triggered:</strong> Closing this cycle will automatically reclassify 
              unverified items as LOST and log a permanent write-off event.
            </div>
          </div>
        </section>

        {/* Section 4: Refusal repel */}
        <section className="story-section" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <div className="story-card">
            <span className="mono" style={{ fontSize: "10.5px", textTransform: "uppercase", color: "var(--text-3)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              ATOM 4 · THE REFUSAL
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>Refusal Made Physical</h2>
            <p style={{ color: "var(--text-2)", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" }}>
              If two users reach for the same physical resource, the node repels. AssetFlow enforces conflict 
              resolutions before they happen. No red alert boxes or pop-up warning sounds; the refusal is represented 
              directly as mechanical repulsion.
            </p>
            <div className="refusal-alert" style={{ margin: 0, padding: "10px 12px" }}>
              <div className="refusal-alert-content" style={{ fontSize: "12px" }}>
                <h4>Priya has this asset</h4>
                <p style={{ margin: 0, fontSize: "11px" }}>Requested transfers will notify Priya for immediate release.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Pull back & Close */}
        <section className="story-section" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div className="story-card" style={{ textAlign: "center", maxWidth: "500px", backgroundColor: "rgba(255,255,255,0.95)" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px" }}>Know where everything is.</h2>
            <p style={{ color: "var(--text-2)", fontSize: "14px", marginBottom: "28px" }}>
              And whose hands it's in. Graceful ledgers for high-accountability workspaces.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={onEnterApp}
              style={{ width: "100%", padding: "12px", height: "auto", fontSize: "14px", fontWeight: "600" }}
            >
              Enter AssetFlow
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
