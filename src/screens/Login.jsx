import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { ConstellationCanvas } from "../components/ConstellationCanvas";

export const Login = ({ onBackToLanding }) => {
  const { login, employees, promoteEmployeeRole } = useContext(AppContext);
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [isForgotView, setIsForgotView] = useState(false);
  
  const [email, setEmail] = useState("sarah@assetflow.com");
  const [password, setPassword] = useState("password");
  
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmitLogin = (e) => {
    e.preventDefault();
    setError("");
    const res = login(email, password);
    if (!res.success) {
      setError(res.error);
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    
    if (!signUpName || !signUpEmail) {
      setError("Please fill out all fields.");
      return;
    }

    // Add to employees list in state (we create mock ID)
    const newEmp = {
      id: `E-${Date.now()}`,
      name: signUpName,
      role: "Employee", // Default role per PRD
      dept: "Unassigned",
      email: signUpEmail,
      avatar: signUpName.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2)
    };

    // Push new employee using local promoter or state updating
    promoteEmployeeRole(newEmp.id, "Employee", "Unassigned");
    
    // Update local employees cache
    employees.push(newEmp);

    setSuccessMsg("Account created. New accounts start as Employee. An admin sets your role and department once you're in.");
    setIsLoginView(true);
    setEmail(signUpEmail);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!forgotEmail) {
      setError("Please enter your email.");
      return;
    }
    const token = `AF-RST-${Math.floor(100000 + Math.random() * 900000)}`;
    setResetToken(token);
    setSuccessMsg(`Reset token generated. Paste it below to set a new password.`);
  };

  return (
    <div className="landing-hero" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Background canvas simulation (faint threads drifting behind) */}
      <div 
        className="constellation-wrapper" 
        style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%", 
          zIndex: 1, 
          opacity: 0.15,
          pointerEvents: "none"
        }}
      >
        <ConstellationCanvas activeStep={0} prefersReducedMotion={false} />
      </div>

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "420px", padding: "0 16px" }}>
        
        {/* Back link */}
        <div style={{ marginBottom: "16px" }}>
          <button 
            onClick={onBackToLanding} 
            style={{ 
              background: "none", 
              border: "none", 
              color: "var(--text-3)", 
              fontSize: "12px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "4px" 
            }}
          >
            ← Back to Landing
          </button>
        </div>

        {/* Login box */}
        <div className="story-card" style={{ width: "100%", maxWidth: "none", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)" }}>
          
          <div style={{ marginBottom: "24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--ink)", marginBottom: "4px" }}>
              {isForgotView ? "Reset Password" : isLoginView ? "Sign in to AssetFlow" : "Create Account"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
              {isForgotView 
                ? "Enter your email to request a reset link" 
                : isLoginView 
                  ? "Enter credentials to access the ledger" 
                  : "Signup creates an Employee — no role picker."
              }
            </p>
          </div>

          {error && (
            <div className="consequence-warning-box" style={{ fontSize: "12px", padding: "8px 12px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)", padding: "8px 12px", borderRadius: "4px", fontSize: "12px", marginBottom: "16px" }}>
              {successMsg}
            </div>
          )}

          {isForgotView ? (
            /* Forgot Password Form */
            <form onSubmit={resetToken ? (e) => { e.preventDefault(); setIsForgotView(false); setResetToken(""); setSuccessMsg("Password updated successfully."); } : handleForgotPassword}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={forgotEmail} 
                  onChange={(e) => setForgotEmail(e.target.value)} 
                  placeholder="name@company.com" 
                  required
                />
              </div>

              {resetToken && (
                <>
                  <div className="form-group">
                    <label>Reset Token</label>
                    <input 
                      type="text" 
                      className="form-control mono" 
                      value={resetToken} 
                      readOnly 
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="••••••••" 
                      required 
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
                {resetToken ? "Update Password" : "Generate Token"}
              </button>

              <button 
                type="button" 
                className="btn" 
                style={{ width: "100%", marginTop: "8px", border: "none" }}
                onClick={() => { setIsForgotView(false); setError(""); setSuccessMsg(""); }}
              >
                Back to Login
              </button>
            </form>
          ) : isLoginView ? (
            /* Login Form */
            <form onSubmit={handleSubmitLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@company.com" 
                  required
                />
              </div>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ margin: 0 }}>Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotView(true); setError(""); setSuccessMsg(""); }} 
                    style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "11px", cursor: "pointer" }}
                  >
                    Forgot?
                  </button>
                </div>
                <input 
                  type="password" 
                  className="form-control" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
                Sign In
              </button>

              <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px" }}>
                <span style={{ color: "var(--text-3)" }}>Need an account? </span>
                <button 
                  type="button" 
                  onClick={() => { setIsLoginView(false); setError(""); setSuccessMsg(""); }} 
                  style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: "500", cursor: "pointer" }}
                >
                  Sign up
                </button>
              </div>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignUp}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={signUpName} 
                  onChange={(e) => setSignUpName(e.target.value)} 
                  placeholder="Sarah Jenkins" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={signUpEmail} 
                  onChange={(e) => setSignUpEmail(e.target.value)} 
                  placeholder="sarah@company.com" 
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
                Register Account
              </button>

              <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px" }}>
                <span style={{ color: "var(--text-3)" }}>Already have an account? </span>
                <button 
                  type="button" 
                  onClick={() => { setIsLoginView(true); setError(""); setSuccessMsg(""); }} 
                  style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: "500", cursor: "pointer" }}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Seed Logins helper box for testing ease */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--hairline-2)", fontSize: "11px", color: "var(--text-3)", textAlign: "left" }}>
            <span className="mono" style={{ fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Seed credentials (for review):
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div><strong>Admin:</strong> <code className="mono" style={{ cursor: "pointer", color: "var(--accent)" }} onClick={() => setEmail("sarah@assetflow.com")}>sarah@assetflow.com</code></div>
              <div><strong>Manager:</strong> <code className="mono" style={{ cursor: "pointer", color: "var(--accent)" }} onClick={() => setEmail("vikram@assetflow.com")}>vikram@assetflow.com</code></div>
              <div><strong>Employee:</strong> <code className="mono" style={{ cursor: "pointer", color: "var(--accent)" }} onClick={() => setEmail("priya@assetflow.com")}>priya@assetflow.com</code></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
