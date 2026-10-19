import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { ErrorBox } from "../components/Status.jsx";

// One page for both "log in" and "sign up"; mode decides which.
export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const goTo = location.state?.from || "/";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={goTo} replace />;

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser reloading the page
    setError(null);
    setBusy(true);
    try {
      const data = await api(isSignup ? "/auth/signup" : "/auth/login", { method: "POST", body: form });
      login(data);
      navigate(goTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <div className="ticket form-ticket">
        <div className="ticket-main column">
          <p className="eyebrow">{isSignup ? "New here" : "Welcome back"}</p>
          <h1>{isSignup ? "Create your account" : "Log in"}</h1>

          <form onSubmit={handleSubmit} className="form">
            {isSignup && (
              <label>
                Full name
                <input value={form.name} onChange={update("name")} required autoComplete="name" />
              </label>
            )}
            <label>
              Email
              <input type="email" value={form.email} onChange={update("email")} required autoComplete="email" />
            </label>
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={update("password")}
                required
                minLength={isSignup ? 8 : undefined}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              {isSignup && <span className="hint">At least 8 characters.</span>}
            </label>

            <ErrorBox message={error} />
            <button className="btn btn-block" disabled={busy}>
              {busy ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
            </button>
          </form>

          <p className="muted small">
            {isSignup ? "Already have an account? " : "New to Gatepass? "}
            <Link to={isSignup ? "/login" : "/signup"} state={location.state}>
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
