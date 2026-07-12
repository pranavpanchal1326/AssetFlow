import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { ConstellationCanvas } from "../components/ConstellationCanvas";

const DEMO_ACCOUNTS = [
  { role: "Admin", name: "Arjun Mehta", email: "admin@assetflow.app", password: "Admin@123" },
  { role: "Dept Head", name: "Kavita Sharma", email: "kavita.sharma@nexgeninfra.com", password: "Password@123" },
  { role: "Asset Manager", name: "Deepak Nair", email: "deepak.nair@nexgeninfra.com", password: "Password@123" },
  { role: "Employee", name: "Priya Deshmukh", email: "priya.deshmukh@nexgeninfra.com", password: "Password@123" },
];

export const Login = ({ onBackToLanding }) => {
  const { login, signup } = useContext(AppContext);

  // "access" tab: a real account form for actual use, vs a one-click demo panel.
  // Kept fully separate so a real deployment's sign-in page never shows seed
  // credentials, and demo reviewers never have to type anything.
  const [accessMode, setAccessMode] = useState("real"); // "real" | "demo"

  const [isLoginView, setIsLoginView] = useState(true);
  const [isForgotView, setIsForgotView] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoLoadingEmail, setDemoLoadingEmail] = useState("");

  const resetMessages = () => { setError(""); setSuccessMsg(""); };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
    }
  };

  const handleDemoLogin = async (account) => {
    setError("");
    setDemoLoadingEmail(account.email);
    const res = await login(account.email, account.password);
    setDemoLoadingEmail("");
    if (!res.success) {
      setError(res.error);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!signUpName || !signUpEmail || !signUpPassword) {
      setError("Please fill out all fields.");
      return;
    }
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const res = await signup(signUpName, signUpEmail, signUpPassword);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setSuccessMsg("Account created. New accounts start as Employee. An admin sets your role and department once you're in.");
    setIsLoginView(true);
    setEmail(signUpEmail);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!forgotEmail) {
      setError("Please enter your email.");
      return;
    }
    try {
      const { authApi } = await import("../api/client");
      const { resetLink } = await authApi.forgot(forgotEmail);
      if (resetLink) {
        const token = new URLSearchParams(resetLink.split("?")[1]).get("token");
        setResetToken(token);
        setSuccessMsg("Reset token generated. Enter a new password below.");
      } else {
        setSuccessMsg("If that email exists, a reset link has been generated.");
      }
    } catch (err) {
      setError(err.message || "Could not request a reset link.");
    }
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      const { authApi } = await import("../api/client");
      await authApi.reset(resetToken, newPassword);
      setIsForgotView(false);
      setResetToken("");
      setNewPassword("");
      setSuccessMsg("Password updated successfully. Sign in with your new password.");
    } catch (err) {
      setError(err.message || "Could not reset password.");
    }
  };

  return (
    <div className="landing-hero" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
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

        {/* Access mode tabs: real account vs. demo access */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "12px", padding: "4px", backgroundColor: "var(--fill)", borderRadius: "8px", border: "1px solid var(--hairline)" }}>
          <button
            type="button"
            onClick={() => { setAccessMode("real"); resetMessages(); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              backgroundColor: accessMode === "real" ? "var(--surface)" : "transparent",
              color: accessMode === "real" ? "var(--ink)" : "var(--text-3)",
              boxShadow: accessMode === "real" ? "var(--shadow-subtle)" : "none",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAccessMode("demo"); resetMessages(); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              backgroundColor: accessMode === "demo" ? "var(--surface)" : "transparent",
              color: accessMode === "demo" ? "var(--ink)" : "var(--text-3)",
              boxShadow: accessMode === "demo" ? "var(--shadow-subtle)" : "none",
            }}
          >
            Demo Access
          </button>
        </div>

        {/* Access box */}
        <div className="story-card" style={{ width: "100%", maxWidth: "none", backgroundColor: "var(--surface)", border: "1px solid var(--hairline)" }}>

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

          {accessMode === "demo" ? (
            /* ---------- Demo Access: one-click, no typing required ---------- */
            <div>
              <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--ink)", marginBottom: "4px" }}>
                  Explore as a seeded role
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                  One click signs you in with real backend data — no password needed.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleDemoLogin(account)}
                    disabled={!!demoLoadingEmail}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "6px",
                      border: "1px solid var(--hairline)",
                      backgroundColor: "var(--fill)",
                      cursor: demoLoadingEmail ? "default" : "pointer",
                      textAlign: "left",
                      opacity: demoLoadingEmail && demoLoadingEmail !== account.email ? 0.5 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{account.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-3)" }} className="mono">{account.email}</div>
                    </div>
                    <span
                      className="mono"
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        backgroundColor: "var(--accent-soft)",
                        color: "var(--accent)",
                      }}
                    >
                      {demoLoadingEmail === account.email ? "Signing in…" : account.role}
                    </span>
                  </button>
                ))}
              </div>

              <p style={{ fontSize: "10.5px", color: "var(--text-3)", marginTop: "16px", lineHeight: 1.5 }}>
                These are seeded demo accounts (created by <code className="mono">npm run seed</code>) for reviewing the product. For a real deployment, use the <strong>Sign In</strong> tab instead.
              </p>
            </div>
          ) : (
            /* ---------- Real account access: login / signup / forgot password ---------- */
            <>
              <div style={{ marginBottom: "24px", textAlign: "center" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--ink)", marginBottom: "4px" }}>
                  {isForgotView ? "Reset Password" : isLoginView ? "Sign in to AssetFlow" : "Create Account"}
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                  {isForgotView
                    ? "Enter your email to request a reset link"
                    : isLoginView
                      ? "Enter your account credentials to continue"
                      : "Signup creates an Employee — no role picker."
                  }
                </p>
              </div>

              {isForgotView ? (
                /* Forgot Password Form */
                <form onSubmit={resetToken ? handleCompleteReset : handleForgotPassword}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      disabled={!!resetToken}
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
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
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
                    onClick={() => { setIsForgotView(false); resetMessages(); }}
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
                        onClick={() => { setIsForgotView(true); resetMessages(); }}
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

                  <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign In"}
                  </button>

                  <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-3)" }}>Need an account? </span>
                    <button
                      type="button"
                      onClick={() => { setIsLoginView(false); resetMessages(); }}
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
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={submitting}>
                    {submitting ? "Creating…" : "Register Account"}
                  </button>

                  <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-3)" }}>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => { setIsLoginView(true); resetMessages(); }}
                      style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: "500", cursor: "pointer" }}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
