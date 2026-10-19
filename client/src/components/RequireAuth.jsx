import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

// Wrap a page with this to make it logged-in only.
// Logged-out visitors are sent to /login and brought back afterwards.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="muted center">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
